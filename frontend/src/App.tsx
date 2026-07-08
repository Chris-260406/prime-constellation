import { useState, useEffect } from 'react'
import { SpiralDemo } from '@/components/demo'
import PrimeConstellation from './components/PrimeConstellation'

export default function App() {
  const [stage, setStage] = useState<'intro' | 'app'>('intro')
  const [primeData, setPrimeData] = useState<any>(null)

  // Pre-load the heavy 17MB atlas while the user is watching the intro
  useEffect(() => {
    fetch('/primes_1m.json')
      .then(res => res.json())
      .then(d => setPrimeData(d))
      .catch(err => console.error("Failed to load primes:", err))
  }, [])

  return (
    <>
      {stage === 'intro' && <SpiralDemo onEnter={() => setStage('app')} />}
      {stage === 'app' && <PrimeConstellation preloadedData={primeData} />}
    </>
  )
}
