import { useRef, useEffect, useCallback } from 'react'
import * as THREE from 'three'

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

export function useVideoTextures() {
  const videosRef = useRef([])    // { video, texture } per section
  const fallbackRef = useRef(null)

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

  // ── Create ONE video + texture per section ──
  useEffect(() => {
    const entries = []

    VIDEO_PATHS.forEach((path, index) => {
      const video = createVideoElement(path, index <= 1 ? 'auto' : 'metadata')
      const texture = createVideoTexture(video)

      // Start first section playing immediately
      if (index === 0) {
        video.play().catch(() => {})
      }

      entries.push({ video, texture })
    })

    videosRef.current = entries

    return () => {
      entries.forEach(({ video, texture }) => {
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
    if (!entries.length || !fallback) {
      return { primary: fallback, blend: fallback, factor: 0 }
    }

    // Wrap the section index to cycle through available videos
    const videoIndex = sectionIndex % entries.length
    const entry = entries[videoIndex]
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
    if (!entries.length) return
    const activeVideoIndex = sectionIndex % entries.length

    entries.forEach((entry, idx) => {
      if (idx === activeVideoIndex) {
        // Play ONLY the active video
        entry.video.preload = 'auto'
        if (entry.video.readyState === 0) entry.video.load()
        entry.video.play().catch(() => {})
      } else if (Math.abs(idx - activeVideoIndex) <= 1) {
        // Pre-buffer adjacent videos but keep them PAUSED
        entry.video.preload = 'auto'
        if (entry.video.readyState === 0) entry.video.load()
        entry.video.pause()
      } else {
        // Distant videos: stop buffering to save bandwidth + memory
        entry.video.pause()
        entry.video.preload = 'metadata'
      }
    })
  }, [])

  return { update, switchToSection, fallbackRef }
}
