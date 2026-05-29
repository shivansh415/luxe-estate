import { memo } from 'react'
import { motion } from 'framer-motion'

/**
 * ProjectsPage
 *
 * FIX M-8: All inline styles migrated to CSS classes defined in index.css.
 * This prevents CSSOM object recreation on every Framer Motion animation tick
 * and enables browser style deduplication.
 */
function ProjectsPage({ onBackToHome, onEnterShowcase }) {
  return (
    <motion.div
      className="standalone-page projects-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="projects-inner">
        <motion.h1
          className="projects-title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 0.9, y: 0 }}
          transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          Projects
        </motion.h1>

        <motion.p
          className="projects-subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 1.2, delay: 0.5 }}
        >
          Curated Architectural Monographs
        </motion.p>

        <motion.button
          className="projects-showcase-btn"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 0.72, ease: [0.22, 1, 0.36, 1] }}
          onClick={onEnterShowcase}
        >
          <span>Enter the Showcase</span>
        </motion.button>

        <motion.button
          className="projects-back-btn"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 0.92, ease: [0.22, 1, 0.36, 1] }}
          onClick={onBackToHome}
        >
          Back to Home
          <div className="projects-back-btn__line" aria-hidden="true" />
        </motion.button>
      </div>
    </motion.div>
  )
}

export default memo(ProjectsPage)
