'use client'

import { SpiralAnimation } from "@/components/ui/spiral-animation"
import { useState, useEffect } from 'react'

export const SpiralDemo = ({ onEnter }: { onEnter?: () => void }) => {
  const [startVisible, setStartVisible] = useState(false)
  const [fading, setFading] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setStartVisible(true)
    }, 2000)
    
    return () => clearTimeout(timer)
  }, [])

  const handleEnter = () => {
    setFading(true)
    setTimeout(() => {
      if (onEnter) onEnter()
    }, 1500) // 1.5s fade out
  }
  
  return (
    <div className={`fixed inset-0 w-full h-full overflow-hidden bg-black transition-opacity duration-1500 ${fading ? 'opacity-0' : 'opacity-100'} z-50`}>
      <div className="absolute inset-0">
        <SpiralAnimation />
      </div>
      
      <div 
        className={`
          absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10
          transition-all duration-1500 ease-out
          ${startVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `}
      >
        <button 
          onClick={handleEnter}
          className="
            text-white text-2xl tracking-[0.2em] uppercase font-extralight
            transition-all duration-700
            hover:tracking-[0.3em] animate-pulse
          "
        >
          Enter
        </button>
      </div>
    </div>
  )
}
