import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ScrollIndicator() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const docHeight = document.documentElement.scrollHeight
      const winHeight = window.innerHeight

      // Hide in the top 25% of viewport (hero section) to prevent overlap with "Enter the Experience"
      const isAtTop = scrollY < winHeight * 0.25
      
      // Hide in the bottom (approaching footer) to keep footer clean
      const isAtBottom = scrollY + winHeight > docHeight - 750

      setIsVisible(!isAtTop && !isAtBottom)
    }

    // Run initial check
    handleScroll()

    // Passive listener for better performance
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 15 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'fixed',
            bottom: '3rem',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.8rem',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: '1px',
              height: '30px',
              background: 'linear-gradient(180deg, rgba(176, 122, 90, 0.5), transparent)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

