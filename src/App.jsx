import { useState, useCallback, useEffect, useRef, memo } from 'react'
import { YouTubePlayerProvider } from './context/YouTubePlayerContext'
import CinematicScene from './components/WebGL/CinematicScene'
import HeroSection from './components/UI/HeroSection'
import Navigation from './components/UI/Navigation'
import FullscreenMenu from './components/UI/FullscreenMenu'
import LoadingScreen from './components/UI/LoadingScreen'
import CursorFollower from './components/UI/CursorFollower'
import ScrollIndicator from './components/UI/ScrollIndicator'
import EditorialSection from './components/UI/EditorialSection'
import CinematicCard from './components/UI/CinematicCard'
import CenterTextSection from './components/UI/CenterTextSection'
import LeftCardSection from './components/UI/LeftCardSection'
import VerticalCardSection from './components/UI/VerticalCardSection'
import RightCardSection from './components/UI/RightCardSection'
import LeftVerticalCardSection from './components/UI/LeftVerticalCardSection'
import EditorialVerticalCard from './components/UI/EditorialVerticalCard'
import MissionSection from './components/UI/MissionSection'
import Footer from './components/UI/Footer'
import CinematicTransitionProvider from './components/UI/CinematicTransitionProvider'
import { EDITORIAL_SECTIONS } from './data/editorialSections'
import { useSmoothScroll } from './hooks/useSmoothScroll'
import { useCinematicTransition } from './hooks/useCinematicTransition'
import ProjectsPage from './components/Pages/ProjectsPage'
import AboutPage from './components/Pages/AboutPage'
import ContactPage from './components/Pages/ContactPage'
import ShowcasePage from './components/Pages/ShowcasePage'

/**
 * Memoized components to prevent re-renders from App state changes.
 * These components don't depend on scroll state.
 */
const MemoizedHeroSection = memo(HeroSection)
const MemoizedCursorFollower = memo(CursorFollower)
const MemoizedCinematicCard = memo(CinematicCard)
const MemoizedCenterText = memo(CenterTextSection)
const MemoizedLeftCard = memo(LeftCardSection)
const MemoizedVerticalCard = memo(VerticalCardSection)
const MemoizedRightCard = memo(RightCardSection)
const MemoizedLeftVerticalCard = memo(LeftVerticalCardSection)
const MemoizedMission = memo(MissionSection)
const MemoizedFooter = memo(Footer)

const PAGE_TRANSITION_COPY = {
  home: {
    eyebrow: 'Chapter I',
    chapter: 'Luxe Estates',
    detail: 'Returning to the marble origin of the experience',
  },
  projects: {
    eyebrow: 'Chapter II',
    chapter: 'Projects',
    detail: 'Entering curated architectural monographs',
  },
  about: {
    eyebrow: 'Chapter III',
    chapter: 'About',
    detail: 'Revealing the philosophy behind the residences',
  },
  contact: {
    eyebrow: 'Chapter IV',
    chapter: 'Contact',
    detail: 'Opening a quieter room for conversation',
  },
  showcase: {
    eyebrow: 'Project Archive',
    chapter: 'Showcase',
    detail: 'Entering the curated architectural exhibition',
  },
}

// FIX L-1: Per-page SEO metadata
const PAGE_META = {
  home: {
    title: 'Luxe Estates — Cinematic Luxury Real Estate',
    description: 'Experience ultra-luxury real estate through a cinematic architectural lens. Private residences, curated monographs, and timeless modern living.',
  },
  projects: {
    title: 'Projects — Luxe Estates',
    description: 'Curated architectural monographs. A collection of the finest luxury residences and bespoke architectural commissions.',
  },
  about: {
    title: 'About — Luxe Estates',
    description: 'The philosophy behind Luxe Estates. Precision, elegance, legacy, and craftsmanship — architecture shaped by restraint.',
  },
  contact: {
    title: 'Contact — Luxe Estates',
    description: 'Begin a private conversation about your luxury residence. Architectural storytelling and timeless modern living await.',
  },
  showcase: {
    title: 'Showcase — Luxe Estates',
    description: 'The Luxe Estates cinematic architectural exhibition. Explore our curated portfolio of luxury residences worldwide.',
  },
}

/** Update browser tab title and meta description for SEO + screen readers */
const updatePageMeta = (page) => {
  const meta = PAGE_META[page] || PAGE_META.home
  document.title = meta.title
  const metaDesc = document.querySelector('meta[name="description"]')
  if (metaDesc) {
    metaDesc.setAttribute('content', meta.description)
  }
}

const PAGE_PATHS = {
  home: '/',
  projects: '/projects',
  about: '/about',
  contact: '/contact',
  showcase: '/showcase',
}

// FIX M-5: Handle unknown routes with a warning, fallback to home
const getPageFromPath = () => {
  const path = window.location.pathname
  const found = Object.entries(PAGE_PATHS).find(([, pagePath]) => pagePath === path)
  if (!found) {
    if (path !== '/') console.warn(`[Luxe Estates] Unknown route "${path}" — redirecting to home`)
    return 'home'
  }
  return found[0]
}

function AppExperience({ scrollProgressRef, currentSectionRef, lenisRef }) {
  const [isReady, setIsReady] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(getPageFromPath)
  const { runTransition } = useCinematicTransition()

  const handleLoadComplete = useCallback(() => {
    setShowContent(true)
  }, [])

  const resetScrollRefs = useCallback(() => {
    scrollProgressRef.current = 0
    currentSectionRef.current = 0

    const bar = document.getElementById('nav-progress-bar')
    if (bar) bar.style.transform = 'scaleX(0)'

    const nav = document.getElementById('main-nav')
    if (nav) nav.classList.remove('nav-scrolled')
  }, [scrollProgressRef, currentSectionRef])

  const scrollToPosition = useCallback((target, options = {}) => {
    const lenis = lenisRef.current
    if (lenis) {
      lenis.scrollTo(target, {
        duration: 1.35,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        ...options,
      })
      return
    }

    window.scrollTo({
      top: typeof target === 'number' ? target : 0,
      behavior: options.immediate ? 'auto' : 'smooth',
    })
  }, [lenisRef])

  const switchPage = useCallback((page, options = {}) => {
    resetScrollRefs()
    scrollToPosition(0, { immediate: true, force: true })
    setCurrentPage(page)
    // FIX L-1: Update title/meta on every page switch
    updatePageMeta(page)
    const nextPath = PAGE_PATHS[page] || PAGE_PATHS.home
    if (!options.replace && window.location.pathname !== nextPath) {
      window.history.pushState({ page }, '', nextPath)
    }
  }, [resetScrollRefs, scrollToPosition])

  useEffect(() => {
    const handlePopState = () => {
      switchPage(getPageFromPath(), { replace: true })
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [switchPage])

  const handleNavigate = useCallback((page) => {
    const copy = PAGE_TRANSITION_COPY[page] || PAGE_TRANSITION_COPY.home
    return runTransition({
      ...copy,
      onCovered: () => switchPage(page),
    })
  }, [runTransition, switchPage])

  const handleEnterExperience = useCallback(() => {
    scrollToPosition(window.innerHeight)
  }, [scrollToPosition])

  const handleBackHome = useCallback(() => {
    handleNavigate('home')
  }, [handleNavigate])

  const handleEnterProjectShowcase = useCallback(() => {
    runTransition({
      ...PAGE_TRANSITION_COPY.showcase,
      onCovered: () => {
        switchPage('showcase')
      },
    })
  }, [runTransition, switchPage])

  const handleMenuOpen = useCallback(() => {
    runTransition({
      eyebrow: 'World Index',
      chapter: 'Menu',
      detail: 'The estate directory opens as a cinematic pause',
      resumeScroll: false,
      onCovered: () => setIsMenuOpen(true),
    })
  }, [runTransition])

  const handleMenuClose = useCallback((targetPage) => {
    const copy = targetPage
      ? PAGE_TRANSITION_COPY[targetPage] || PAGE_TRANSITION_COPY.home
      : {
          eyebrow: 'Return',
          chapter: 'Resume',
          detail: 'The scene settles back into the current chapter',
        }

    runTransition({
      ...copy,
      onCovered: () => {
        setIsMenuOpen(false)
        if (targetPage) switchPage(targetPage)
      },
    })
  }, [runTransition, switchPage])

  // ── Real Preloader Progress Tracking ──
  // Weights (20% each):
  // 1. fonts (document.fonts.ready)
  // 2. domMarble (marble-generated.png preloaded in DOM)
  // 3. domVideo (section-1-reveal.mp4 preloaded in DOM)
  // 4. webglMarble (Three.js TextureLoader completes & uploads marble texture)
  // 5. webglVideo (WebGL video element triggers canplay/canplaythrough)
  const [loadProgress, setLoadProgress] = useState(0)

  const loadedAssetsRef = useRef({
    fonts: false,
    domMarble: false,
    domVideo: false,
    webglMarble: false,
    webglVideo: false,
  })

  const updateProgress = useCallback((assetName, isLoaded) => {
    const assets = loadedAssetsRef.current
    if (assets[assetName] === isLoaded) return
    assets[assetName] = isLoaded

    // Compute progress
    let total = 0
    if (assets.fonts) total += 20
    if (assets.domMarble) total += 20
    if (assets.domVideo) total += 20
    if (assets.webglMarble) total += 20
    if (assets.webglVideo) total += 20

    setLoadProgress(total)
    if (total >= 100) {
      setIsReady(true)
    }
  }, [])

  const handleWebGLProgress = useCallback((assetName, isLoaded) => {
    updateProgress(assetName, isLoaded)
  }, [updateProgress])

  useEffect(() => {
    let cancelled = false

    // Report preloaded assets to console for visibility
    console.log('[Luxe Preload Gate] Initializing preload of critical above-the-fold assets: fonts, marble texture, and hero reveal video...')

    // 1. Fonts — wait for Bebas Neue, Bricolage Grotesque, Cormorant Garamond
    document.fonts.ready.then(() => {
      if (cancelled) return
      updateProgress('fonts', true)
    }).catch(() => {
      if (cancelled) return
      updateProgress('fonts', true)
    })

    // 2. DOM Marble Texture image preload
    const marbleImg = new Image()
    marbleImg.onload = () => {
      if (cancelled) return
      updateProgress('domMarble', true)
    }
    marbleImg.onerror = () => {
      if (cancelled) return
      updateProgress('domMarble', true)
    }
    marbleImg.src = '/textures/marble-generated.png'

    // 3. DOM Video element preload
    const heroVideo = document.createElement('video')
    heroVideo.preload = 'auto'
    heroVideo.muted = true
    heroVideo.playsInline = true
    let heroResolved = false
    const resolveHero = () => {
      if (heroResolved) return
      heroResolved = true
      if (cancelled) return
      updateProgress('domVideo', true)
      heroVideo.oncanplay = null
      heroVideo.oncanplaythrough = null
    }
    heroVideo.oncanplay = resolveHero
    heroVideo.oncanplaythrough = resolveHero
    heroVideo.src = '/videos/section-1-reveal.mp4'
    const heroTimeout = setTimeout(resolveHero, 2000)

    // 6s safe fallback timeout to prevent infinite preloader in case of network issues
    const safetyTimer = setTimeout(() => {
      if (cancelled) return
      console.warn('[Luxe Preload Gate] Safe fallback timeout reached. Forcing preloader completion.')
      updateProgress('fonts', true)
      updateProgress('domMarble', true)
      updateProgress('domVideo', true)
      updateProgress('webglMarble', true)
      updateProgress('webglVideo', true)
    }, 6000)

    return () => {
      cancelled = true
      clearTimeout(heroTimeout)
      clearTimeout(safetyTimer)
      marbleImg.onload = null
      marbleImg.onerror = null
      heroVideo.oncanplay = null
      heroVideo.oncanplaythrough = null
    }
  }, [updateProgress])

  return (
    <>
      {/* Loading Screen */}
      {!showContent && (
        <LoadingScreen isLoaded={isReady} realProgress={loadProgress} onComplete={handleLoadComplete} />
      )}

      {/* Custom Cursor */}
      <MemoizedCursorFollower />

      {/* Fixed WebGL Background — reads refs directly in useFrame, no re-renders */}
      {currentPage !== 'showcase' && (
        <CinematicScene
          scrollProgressRef={scrollProgressRef}
          currentSectionRef={currentSectionRef}
          onWebGLProgress={handleWebGLProgress}
        />
      )}

      {/* Scroll Content Layer */}
      <div className="content-layer">
        {/* Navigation — reads refs for progress bar */}
        {currentPage !== 'showcase' && (
          <Navigation
            onMenuOpen={handleMenuOpen}
            onNavigate={handleNavigate}
            navTextColor={currentPage === 'home' ? undefined : 'rgba(245, 240, 232, 0.88)'}
          />
        )}

        {/* Fullscreen Cinematic Menu */}
        <FullscreenMenu isOpen={isMenuOpen} onClose={handleMenuClose} lenisRef={lenisRef} />

        <main className="scene-shell">
          {/* Conditionally render pages or home scroll layers */}
          {currentPage === 'home' && (
            <>
              {/* Hero Landing Section */}
              <MemoizedHeroSection onEnterExperience={handleEnterExperience} />

              {/* Scroll Indicator */}
              {showContent && <ScrollIndicator />}

              {/* Section 1 — Large Editorial Typography */}
              <EditorialSection />

              {/* Section 2 — Cinematic Media Card (Center) */}
              <MemoizedCinematicCard />

              {/* Section 3 — Center Text Section */}
              <MemoizedCenterText />

              {/* Section 4 — Left Horizontal Card */}
              <MemoizedLeftCard />

              {/* Section 5 — Right Vertical Card */}
              <MemoizedVerticalCard />

              {/* Section 6 — Right Horizontal Card */}
              <MemoizedRightCard />

              {/* Section 7 — Left Vertical Card */}
              <MemoizedLeftVerticalCard />

              {/* Sections 8–11 — Editorial Vertical Cards (modular) */}
              {EDITORIAL_SECTIONS.map((section) => (
                <EditorialVerticalCard key={section.id} {...section} />
              ))}

              {/* Section 12 — Our Mission */}
              <MemoizedMission />

              {/* Footer */}
              <MemoizedFooter />
            </>
          )}

          {currentPage === 'projects' && (
            <ProjectsPage
              onBackToHome={handleBackHome}
              onEnterShowcase={handleEnterProjectShowcase}
            />
          )}

          {currentPage === 'about' && (
            <AboutPage
              onBackToHome={handleBackHome}
              onRequestConsultation={() => handleNavigate('contact')}
              lenisRef={lenisRef}
            />
          )}

          {currentPage === 'contact' && (
            <ContactPage onBackToHome={handleBackHome} />
          )}

          {currentPage === 'showcase' && (
            <ShowcasePage onBackToProjects={() => handleNavigate('projects')} lenisRef={lenisRef} />
          )}
        </main>
      </div>
    </>
  )
}

function App() {
  // scrollProgressRef and currentSectionRef are REFS — reading them
  // does NOT cause re-renders. The WebGL layer reads them in useFrame.
  const { scrollProgressRef, currentSectionRef, lenisRef } = useSmoothScroll()

  return (
    <YouTubePlayerProvider>
      <CinematicTransitionProvider lenisRef={lenisRef}>
        <AppExperience
          scrollProgressRef={scrollProgressRef}
          currentSectionRef={currentSectionRef}
          lenisRef={lenisRef}
        />
      </CinematicTransitionProvider>
    </YouTubePlayerProvider>
  )
}

export default App
