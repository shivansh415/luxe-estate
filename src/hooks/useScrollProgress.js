import { useEffect, useState, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function useScrollProgress(triggerRef, options = {}) {
  const [progress, setProgress] = useState(0)
  const progressRef = useRef(0)

  useEffect(() => {
    if (!triggerRef.current) return

    const trigger = ScrollTrigger.create({
      trigger: triggerRef.current,
      start: options.start || 'top bottom',
      end: options.end || 'bottom top',
      scrub: true,
      onUpdate: (self) => {
        progressRef.current = self.progress
        setProgress(self.progress)
      },
      ...options,
    })

    return () => trigger.kill()
  }, [triggerRef, options])

  return { progress, progressRef }
}
