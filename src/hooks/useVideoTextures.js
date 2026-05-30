import { useRef, useEffect, useCallback } from 'react'
import * as THREE from 'three'
import { isMobile } from '../utils/mobile'

/**
 * Video paths — one per cinematic section.
 * These are PING-PONG encoded: forward + reverse concatenated,
 * so the last frame seamlessly connects to the first frame.
 *
 * With ping-pong encoding, native `video.loop = true` produces
 * a seamless loop because frame[0] ≈ frame[last]. No dual-buffer needed.
 */
const VIDEO_PATHS = [
  '/videos/section-1-reveal.mp4',
  '/videos/section-2-reveal.mp4',
  '/videos/section-3-reveal.mp4',
  '/videos/section-4-reveal.mp4',
  '/videos/section-5-reveal.mp4',
]

/**
 * Creates a silent, inline-playable, looping video element.
 *
 * SINGLE VIDEO PER SECTION — no dual-buffer.
 * Ping-pong encoding ensures the native loop is seamless.
 */
function createVideoElement(path, preload = 'metadata') {
  const video = document.createElement('video')
  video.src = path
  video.crossOrigin = 'anonymous'
  video.loop = true          // ← native loop — seamless with ping-pong encoding
  video.muted = true
  video.playsInline = true
  video.preload = preload
  video.setAttribute('playsinline', '')
  video.setAttribute('webkit-playsinline', '')
  return video
}

/**
 * Creates a THREE.VideoTexture.
 *
 * THREE.VideoTexture uses requestVideoFrameCallback internally
 * to set needsUpdate = true at the exact moment a new decoded
 * frame is available. We NEVER manually touch needsUpdate.
 */
function createVideoTexture(video) {
  const texture = new THREE.VideoTexture(video)
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.format = THREE.RGBAFormat
  texture.generateMipmaps = false
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

// ================================================================
//  SINGLE-BUFFER VIDEO TEXTURE SYSTEM
//
//  One video element + one texture per section.
//  Ping-pong encoding handles seamless looping.
//  THREE.VideoTexture's rVFC handles GPU upload timing.
//
//  This eliminates:
//    - Double video decode overhead
//    - Double GPU texture uploads
//    - Texture swap flicker
//    - Complex state machine race conditions
//    - requestVideoFrameCallback conflicts between two textures
// ================================================================

export function useVideoTextures(onFirstVideoReady) {
  const videosRef = useRef([])    // { video, texture } per section
  const fallbackRef = useRef(null)
  const onFirstVideoReadyRef = useRef(onFirstVideoReady)

  useEffect(() => {
    onFirstVideoReadyRef.current = onFirstVideoReady
  }, [onFirstVideoReady])

  // ── Fallback texture ──
  useEffect(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 2
    canvas.height = 2
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, 2, 2)
    const tex = new THREE.CanvasTexture(canvas)
    tex.minFilter = THREE.LinearFilter
    tex.magFilter = THREE.LinearFilter
    fallbackRef.current = tex
    return () => tex.dispose()
  }, [])

  // ── Lazy per-section video creation ──
  // Desktop: create all 5 up-front (existing behavior, ~19MB but plays smoothly).
  // Mobile: create ONLY section 0 at mount; others created on demand inside
  //         `switchToSection`. Cuts initial decode pressure from ~19MB to ~3.7MB.
  useEffect(() => {
    const mobile = isMobile()
    const entries = new Array(VIDEO_PATHS.length).fill(null)

    const createEntry = (index) => {
      const existing = entries[index]
      if (existing) return existing

      const path = VIDEO_PATHS[index]
      // Active + immediate neighbors get 'auto' so they buffer aggressively.
      // Distant videos use 'metadata' (a few KB only).
      const preload = index <= 1 ? 'auto' : 'metadata'
      const video = createVideoElement(path, preload)
      const texture = createVideoTexture(video)

      const entry = { video, texture }
      entries[index] = entry

      // Section 0: signal first-video-ready and start playback
      if (index === 0) {
        const handleReady = () => {
          onFirstVideoReadyRef.current?.()
          video.oncanplay = null
          video.oncanplaythrough = null
        }
        if (video.readyState >= 3) {
          onFirstVideoReadyRef.current?.()
        } else {
          video.oncanplay = handleReady
          video.oncanplaythrough = handleReady
        }
        video.play().catch(() => {})
      }

      return entry
    }

    // Always create section 0 immediately (it's the active shader video).
    createEntry(0)

    // Desktop: also create the rest now so transitions are instant.
    // Mobile: defer — they'll be created lazily by switchToSection.
    if (!mobile) {
      for (let i = 1; i < VIDEO_PATHS.length; i += 1) createEntry(i)
    }

    videosRef.current = entries
    // Stash the lazy creator on the ref so switchToSection can use it.
    videosRef.current.__create = createEntry

    return () => {
      entries.forEach((entry) => {
        if (!entry) return
        const { video, texture } = entry
        video.oncanplay = null
        video.oncanplaythrough = null
        video.pause()
        video.removeAttribute('src')
        video.load()
        texture.dispose()
      })
    }
  }, [])

  // ── Per-frame update — returns the current section's texture ──
  // Cycles through available videos when section count > video count.
  const update = useCallback((sectionIndex) => {
    const fallback = fallbackRef.current
    const entries = videosRef.current
    if (!entries || !entries.length || !fallback) {
      return { primary: fallback, blend: fallback, factor: 0 }
    }

    const videoIndex = sectionIndex % entries.length
    let entry = entries[videoIndex]
    // Lazy-create on mobile when a section is reached for the first time.
    if (!entry && entries.__create) {
      entry = entries.__create(videoIndex)
    }
    if (!entry) {
      return { primary: fallback, blend: fallback, factor: 0 }
    }

    return { primary: entry.texture }
  }, [])

  // ── Section switching — FIX M-1: only ONE video plays at a time ──
  // Adjacent videos are preloaded (buffered) but paused.
  // Mobile hardware decoders can only decode 1–2 streams simultaneously;
  // playing 3 at once causes software-decode fallback and thermal throttling.
  const switchToSection = useCallback((sectionIndex) => {
    const entries = videosRef.current
    if (!entries || !entries.length) return
    const len = entries.length
    const activeVideoIndex = sectionIndex % len

    // On mobile, lazy-create the active and immediate neighbors so the
    // user never sees the fallback when scrubbing forward.
    if (entries.__create) {
      entries.__create(activeVideoIndex)
      entries.__create((activeVideoIndex + 1) % len)
      entries.__create((activeVideoIndex - 1 + len) % len)
    }

    entries.forEach((entry, idx) => {
      if (!entry) return
      if (idx === activeVideoIndex) {
        entry.video.preload = 'auto'
        if (entry.video.readyState === 0) entry.video.load()
        entry.video.play().catch(() => {})
      } else if (Math.abs(idx - activeVideoIndex) <= 1) {
        entry.video.preload = 'auto'
        if (entry.video.readyState === 0) entry.video.load()
        entry.video.pause()
      } else {
        entry.video.pause()
        entry.video.preload = 'metadata'
      }
    })
  }, [])

  return { update, switchToSection, fallbackRef }
}
