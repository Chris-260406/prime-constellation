import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Noise, ChromaticAberration } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { OrbitControls, Html } from '@react-three/drei'
import { Mail, Link, User, Code, Camera, Sparkles } from 'lucide-react'
import * as THREE from 'three'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(useGSAP, ScrollTrigger)

// Start the camera close so the constellation is beautiful and large immediately.
const cameraProxy = { z: 120, x: 0, y: 0 }

const HISTORY_BEATS = [
  { id: '01', title: "The Atoms (c. 300 BC)", desc: "Euclid proves infinite primes exist. Eratosthenes gives the sieve." },
  { id: '02', title: "The Guess (1792)", desc: "15-year-old Gauss notices primes thin out like 1/log(x) — the Prime Number Theorem, unproven for a century." },
  { id: '03', title: "The Turn (1859)", desc: "Riemann's 8-page paper extends ζ(s) to the complex plane — its zeros encode the primes exactly. He conjectures every nontrivial zero has real part ½. Still unproven. $1M Clay Prize." },
  { id: '04', title: "The Proof (1896)", desc: "Hadamard and de la Vallée Poussin independently prove the Prime Number Theorem using Riemann's zeta machinery." },
  { id: '05', title: "The Music (1972)", desc: "Montgomery describes zeta-zero spacing to physicist Freeman Dyson over tea — it matches the energy-level statistics of atomic nuclei (GUE, random matrix theory)." },
  { id: '06', title: "The Frontier (2013–now)", desc: "Yitang Zhang proves a bounded prime gap exists (< 70 million). Maynard/Polymath push it to 246. Twin primes (gap 2) remains open." }
]

const MATH_CARDS = [
  { title: "Explicit Formula", tag: "THEOREM (von Mangoldt, 1895)", formula: "ψ(x) = x − Σ_ρ x^ρ/ρ − log(2π) − ½log(1 − x⁻²)", gloss: "The zeros are the harmonics of the primes." },
  { title: "Prime Race", tag: "CONJECTURE (under GRH — Rubinstein–Sarnak, 1994)", formula: "π(x;4,3) vs π(x;4,1) — first crossing at x = 26861, density δ(4;3,1) = 0.9959", gloss: "Primes ≡ 3 mod 4 lead almost always." },
  { title: "Hardy–Littlewood Twins", tag: "CONJECTURE (1923)", formula: "π₂(x) ~ 2C₂∫dt/(log t)², C₂ ≈ 0.6601618", gloss: "Accurate to six parts in ten million at x = 10¹⁵ — still unproven." },
  { title: "GUE Pair Correlation", tag: "CONJECTURE (numerically overwhelming — Odlyzko, 1987)", formula: "1 − (sin πu/πu)²", gloss: "Zeta zeros repel like random-matrix eigenvalues." }
]

const PrimeGalaxy = ({ data }: { data: any }) => {
  const pointsRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  
  const { positions, colors, sizes } = useMemo(() => {
    const MAX_PARTICLES = 150000
    const p = data.p.slice(0, MAX_PARTICLES)
    const r210 = data.r210.slice(0, MAX_PARTICLES)
    const count = p.length

    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)

    const colorTable = new Float32Array(210 * 3)
    const tempColor = new THREE.Color()
    for (let i = 0; i < 210; i++) {
      tempColor.setHSL(0.78, 0.85, 0.4 + (i / 210) * 0.6)
      colorTable[i * 3 + 0] = tempColor.r
      colorTable[i * 3 + 1] = tempColor.g
      colorTable[i * 3 + 2] = tempColor.b
    }

    const goldenAngle = Math.PI * (3 - Math.sqrt(5))

    for (let i = 0; i < count; i++) {
      const prime = p[i]
      const theta = prime * goldenAngle
      const r = Math.sqrt(prime) * 0.08

      positions[i * 3 + 0] = r * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(theta)
      positions[i * 3 + 2] = -Math.sqrt(prime) * 0.1

      const mod210 = r210[i]
      colors[i * 3 + 0] = colorTable[mod210 * 3 + 0]
      colors[i * 3 + 1] = colorTable[mod210 * 3 + 1]
      colors[i * 3 + 2] = colorTable[mod210 * 3 + 2]
      sizes[i] = 1.0
    }

    return { positions, colors, sizes }
  }, [data])

  const uniforms = useMemo(() => ({
    uCameraZ: { value: 0 },
    uTime: { value: 0 },
    uProgress: { value: 0.0 }
  }), [])

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uCameraZ.value = state.camera.position.z
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
      
      const t = Math.min(state.clock.elapsedTime * 0.4, 1.0)
      let p = 0
      if (t < 0.15) {
        p = (t / 0.15) * 4.0
      } else {
        const nt = (t - 0.15) / 0.85
        p = 4.0 - (3.0 * (nt * (2 - nt)))
      }
      materialRef.current.uniforms.uProgress.value = p
    }
    if (pointsRef.current) {
      pointsRef.current.rotation.z = state.clock.elapsedTime * 0.02
    }
  })

  const vertexShader = `
    attribute vec3 color;
    attribute float size;
    varying vec3 vColor;
    varying float vDistance;
    uniform float uProgress;
    
    void main() {
      vec3 finalColor = color;
      float r = 0.9 + (uProgress * 0.1);
      float g = 0.5 + (uProgress * 0.5);
      float b = 1.0; 
      vec3 explosionColor = vec3(r, g, b);
      vColor = mix(finalColor, explosionColor, smoothstep(1.0, 4.0, uProgress));
      
      vec3 animatedPosition = position * uProgress;
      vec4 mvPosition = modelViewMatrix * vec4(animatedPosition, 1.0);
      vDistance = -mvPosition.z;
      
      gl_PointSize = clamp(size * (600.0 / max(vDistance, 0.1)), 1.5, 8.0);
      gl_Position = projectionMatrix * mvPosition;
    }
  `

  const fragmentShader = `
    varying vec3 vColor;
    varying float vDistance;
    uniform float uCameraZ;
    uniform float uTime;
    
    void main() {
      vec2 xy = gl_PointCoord.xy - vec2(0.5);
      float sqLength = dot(xy, xy);
      if (sqLength > 0.25) discard;
      
      float alpha = smoothstep(5.0, 50.0, vDistance);
      float twinkle = 0.6 + 0.4 * sin(uTime * 4.0 + vDistance * 0.1);
      float finalAlpha = alpha * (1.0 - (sqLength * 4.0)) * twinkle * 0.5;
      
      gl_FragColor = vec4(vColor, finalAlpha);
    }
  `

  const handlePointerMove = (e: any) => {
    e.stopPropagation()
    if (e.intersections.length > 0) {
      const idx = e.intersections[0].index
      if (idx !== undefined && idx !== hoveredIndex) {
        setHoveredIndex(idx)
        document.body.style.cursor = 'crosshair'
      }
    }
  }

  const handlePointerOut = () => {
    setHoveredIndex(null)
    document.body.style.cursor = 'auto'
  }

  return (
    <points 
      ref={pointsRef}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
    >
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial 
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
      {hoveredIndex !== null && (
        <Html
          position={[
            positions[hoveredIndex * 3],
            positions[hoveredIndex * 3 + 1],
            positions[hoveredIndex * 3 + 2]
          ]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <div className="bg-black/90 backdrop-blur-md border border-purple-500/50 text-white px-4 py-3 rounded-lg font-mono shadow-[0_0_30px_rgba(168,85,247,0.5)] whitespace-nowrap">
            <div className="text-purple-400 mb-1 text-[10px] tracking-widest uppercase flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Prime Found
            </div>
            <div className="text-xl font-bold tracking-tight text-white">{data.primes[hoveredIndex].toLocaleString()}</div>
            <div className="text-white/40 text-[10px] mt-2">Constellation Index: #{hoveredIndex.toLocaleString()}</div>
          </div>
        </Html>
      )}
    </points>
  )
}

const CosmicDust = () => {
  const dustRef = useRef<THREE.Points>(null)
  
  const positions = useMemo(() => {
    const count = 15000
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const radius = 10 + Math.random() * 150
      const theta = Math.random() * Math.PI * 2
      pos[i * 3 + 0] = radius * Math.cos(theta)
      pos[i * 3 + 1] = radius * Math.sin(theta)
      pos[i * 2 + 2] = 150 - Math.random() * 400 
    }
    return pos
  }, [])

  useFrame((state) => {
    if (dustRef.current) {
      dustRef.current.rotation.z = state.clock.elapsedTime * 0.015
      dustRef.current.rotation.x = state.clock.elapsedTime * 0.005
    }
  })

  const dustVertexShader = `
    varying float vDistance;
    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vDistance = -mvPosition.z;
      gl_PointSize = clamp(200.0 / max(vDistance, 0.1), 1.0, 4.0);
      gl_Position = projectionMatrix * mvPosition;
    }
  `

  const dustFragmentShader = `
    varying float vDistance;
    void main() {
      vec2 xy = gl_PointCoord.xy - vec2(0.5);
      float sqLength = dot(xy, xy);
      if (sqLength > 0.25) discard;
      float alpha = (1.0 - (sqLength * 4.0)) * 0.15;
      alpha *= smoothstep(5.0, 30.0, vDistance);
      gl_FragColor = vec4(0.53, 0.67, 1.0, alpha);
    }
  `

  return (
    <points ref={dustRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <shaderMaterial 
        vertexShader={dustVertexShader}
        fragmentShader={dustFragmentShader}
        uniforms={{}}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

const ScrollCameraController = ({ enabled }: { enabled: boolean }) => {
  const { camera } = useThree()
  
  useEffect(() => {
    camera.position.set(cameraProxy.x, cameraProxy.y, cameraProxy.z)
  }, [camera])
  
  useFrame(() => {
    if (!enabled) return
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, cameraProxy.z, 0.08)
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, cameraProxy.x, 0.08)
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, cameraProxy.y, 0.08)
    
    // Parallax Orbiting: Make the camera physically look slightly at the center 
    // of the galaxy as it slides to the extreme sides.
    const targetRotY = -camera.position.x * 0.003
    const targetRotX = camera.position.y * 0.003
    
    // Z-rotation diving
    const progress = Math.max(0, Math.min(1, (120 - cameraProxy.z) / 320))
    const targetRotZ = THREE.MathUtils.lerp(0, Math.PI * 0.25, progress)
    
    camera.rotation.set(
      THREE.MathUtils.lerp(camera.rotation.x, targetRotX, 0.05),
      THREE.MathUtils.lerp(camera.rotation.y, targetRotY, 0.05),
      THREE.MathUtils.lerp(camera.rotation.z, targetRotZ, 0.05)
    )
  })

  return null
}

const SocialLink = ({ icon: Icon, label, url, type }: { icon: any, label: string, url: string, type: string }) => {
  const [isConfirming, setIsConfirming] = useState(false)
  
  return (
    <div className="relative flex flex-col items-center justify-center group pointer-events-auto">
      <button 
        onClick={() => setIsConfirming(true)}
        className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-purple-500/50 group-hover:bg-purple-500/10 group-hover:-translate-y-2 transition-all shadow-lg z-10 cursor-pointer outline-none"
      >
        <Icon size={24} className="text-white/70 group-hover:text-purple-400 transition-colors" />
      </button>
      
      <div className={`absolute top-full mt-4 transition-all duration-300 pointer-events-none whitespace-nowrap z-20 group-hover:translate-y-0 translate-y-[-10px] ${isConfirming ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
        <span className="text-xs font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 px-4 py-2 rounded-full shadow-lg">{label}</span>
      </div>

      {isConfirming && (
        <>
          <div className="fixed inset-0 z-40 cursor-default" onClick={(e) => { e.stopPropagation(); setIsConfirming(false) }} />
          <div className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 z-50 bg-black/90 backdrop-blur-xl border border-purple-500/30 p-4 rounded-2xl w-48 text-center shadow-[0_10px_40px_rgba(168,85,247,0.3)] animate-in fade-in zoom-in-95 duration-150 cursor-default">
             <div className="text-white text-xs font-bold mb-3 tracking-widest uppercase">Open Link?</div>
             <div className="flex gap-2">
               <button 
                 onClick={(e) => { e.stopPropagation(); setIsConfirming(false) }} 
                 className="flex-1 py-2 rounded-xl border border-white/10 text-white/70 font-mono text-xs hover:bg-white/5 transition-colors outline-none"
               >
                 Cancel
               </button>
               <a 
                 href={url} 
                 target={type === 'Email' ? '_self' : '_blank'} 
                 rel="noopener noreferrer" 
                 onClick={(e) => { e.stopPropagation(); setIsConfirming(false) }}
                 className="flex-1 py-2 rounded-xl bg-purple-600 text-white font-mono text-xs font-bold hover:bg-purple-500 transition-colors flex items-center justify-center outline-none"
               >
                 Go
               </a>
             </div>
          </div>
        </>
      )}
    </div>
  )
}

const IgnitionTitle = () => (
  <h1 className="ignition-title text-5xl md:text-7xl lg:text-7xl font-black tracking-tight mb-6 drop-shadow-[0_0_40px_rgba(168,85,247,0.4)] text-white text-center">
    {"PRIME CONSTELLATION".split(' ').map((word, wordIdx) => (
      <span key={wordIdx} className="inline-block whitespace-nowrap mr-4 md:mr-6 last:mr-0">
        {word.split('').map((char, i) => (
          <span key={i} className="char inline-block">{char}</span>
        ))}
      </span>
    ))}
  </h1>
)

export default function PrimeConstellation({ preloadedData }: { preloadedData: any }) {
  const [data, setData] = useState<any>(preloadedData)
  const [isMounted, setIsMounted] = useState(false)
  const [orbitControlsEnabled, setOrbitControlsEnabled] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (data) {
      setTimeout(() => setIsMounted(true), 100)
    }
  }, [data])

  useEffect(() => {
    if (preloadedData && !data) setData(preloadedData)
  }, [preloadedData, data])

  useGSAP(() => {
    if (!isMounted) return
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Initial Title Animation
    const ignitionTl = gsap.timeline()
    ignitionTl.fromTo('.ignition-title .char', 
      { opacity: 0, y: 20 }, 
      { opacity: 1, y: 0, stagger: 0.03, ease: 'power2.out', duration: 1 }
    )
    ignitionTl.fromTo('.ignition-bracket',
      { scaleY: 0 },
      { scaleY: 1, duration: 0.8, ease: 'power2.inOut' },
      "-=0.5"
    )
    ignitionTl.fromTo('.ignition-text',
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 1 },
      "-=0.5"
    )

    // Master Scroll Camera Scrub
    gsap.to(cameraProxy, {
      z: -200,
      ease: 'none',
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: prefersReducedMotion ? false : 1,
        onUpdate: (self) => {
          // If we reach the very bottom, enable orbit controls
          setOrbitControlsEnabled(self.progress > 0.98)
        }
      }
    })

    // Shift camera X/Y to give room for History Beats (Text on Left -> Sphere goes Top-Right)
    gsap.to(cameraProxy, {
      x: -55,
      y: -15,
      scrollTrigger: {
        trigger: '.history-container',
        start: 'top center',
        end: 'top -10%',
        scrub: prefersReducedMotion ? false : 1
      }
    })

    // Shift camera X/Y to give room for Math Cards (Text on Right -> Sphere goes Bottom-Left)
    gsap.to(cameraProxy, {
      x: 60,
      y: 20,
      scrollTrigger: {
        trigger: '.math-container',
        start: 'top center',
        end: 'top -10%',
        scrub: prefersReducedMotion ? false : 1
      }
    })

    // Center camera for HUD
    gsap.to(cameraProxy, {
      x: 0,
      y: 0,
      scrollTrigger: {
        trigger: '.hud-element',
        start: 'top bottom',
        end: 'top center',
        scrub: prefersReducedMotion ? false : 1
      }
    })

    // Fade out Hero section on scroll
    gsap.to('.hero-section', {
      opacity: 0,
      y: -50,
      ease: 'power1.in',
      scrollTrigger: {
        trigger: '.hero-section',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    })

    // Animate History Beats as they enter
    const beats = gsap.utils.toArray('.history-beat') as HTMLElement[]
    beats.forEach((beat) => {
      gsap.fromTo(beat,
        { opacity: 0, y: 60, scale: 0.95, filter: 'blur(10px)' },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          filter: 'blur(0px)',
          duration: 1.2, 
          ease: 'power3.out',
          scrollTrigger: {
            trigger: beat,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          }
        }
      )
    })

    // Animate Math Cards as they enter
    const cards = gsap.utils.toArray('.math-card') as HTMLElement[]
    cards.forEach((card) => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
          toggleActions: 'play none none reverse'
        }
      })
      tl.fromTo(card,
        { opacity: 0, x: 60, scale: 0.95, filter: 'blur(10px)' },
        { opacity: 1, x: 0, scale: 1, filter: 'blur(0px)', duration: 1.2, ease: prefersReducedMotion ? 'power2.out' : 'back.out(1.2)' }
      )
      tl.fromTo(card.querySelector('.formula-reveal'),
        { clipPath: 'inset(0 100% 0 0)' },
        { clipPath: 'inset(0 0% 0 0)', duration: 1, ease: 'power2.inOut' },
        "-=0.6"
      )
    })

    // Animate HUD as it enters
    gsap.fromTo('.hud-element',
      { opacity: 0, y: 30 },
      {
        opacity: 1, y: 0, duration: 1, ease: 'power2.out',
        scrollTrigger: {
          trigger: '.hud-element',
          start: 'top 90%',
          toggleActions: 'play none none reverse'
        }
      }
    )
    gsap.fromTo('.hud-bracket', 
      { scaleY: 0 }, 
      { scaleY: 1, duration: 1, ease: 'power2.inOut',
        scrollTrigger: {
          trigger: '.hud-element',
          start: 'top 90%',
          toggleActions: 'play none none reverse'
        }
      }
    )

  }, { scope: containerRef, dependencies: [isMounted] })

  if (!data) {
    return (
      <div className="fixed inset-0 bg-[#000108] flex flex-col items-center justify-center text-purple-500 font-mono z-50">
        <div className="w-12 h-12 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mb-4" />
        <div className="tracking-[0.3em] uppercase text-sm animate-pulse">Initializing Atlas</div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={`w-full relative bg-[#000108] text-white transition-opacity duration-[2000ms] ${isMounted ? 'opacity-100' : 'opacity-0'}`}>
      
      {/* 3D Canvas - Pinned Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 120], fov: 60 }}>
          <color attach="background" args={['#000108']} />
          <fogExp2 attach="fog" args={['#000108', 0.002]} />
          <ScrollCameraController enabled={!orbitControlsEnabled} />
          <CosmicDust />
          <PrimeGalaxy data={data} />
          <EffectComposer multisampling={4}>
            <Noise opacity={0.12} blendFunction={BlendFunction.OVERLAY} />
            <ChromaticAberration offset={new THREE.Vector2(0.0015, 0.0015)} blendFunction={BlendFunction.NORMAL} />
          </EffectComposer>
          {orbitControlsEnabled && (
            <OrbitControls enableZoom={true} enablePan={false} maxDistance={400} minDistance={10} autoRotate={true} autoRotateSpeed={0.5} />
          )}
        </Canvas>
      </div>

      {/* Standard Scrolling Content Overlay */}
      <div className="relative z-10 w-full flex flex-col items-center">
        
        {/* Phase 0: Hero / Ignition */}
        <div className="hero-section w-full min-h-screen flex flex-col items-center justify-center pointer-events-none p-8">
          <div className="relative p-8 md:p-12 text-center max-w-4xl mx-auto flex flex-col items-center">
            <div className="ignition-bracket absolute left-0 top-0 h-full w-8 border-l-2 border-y-2 border-purple-500/30 origin-center" />
            <div className="ignition-bracket absolute right-0 top-0 h-full w-8 border-r-2 border-y-2 border-purple-500/30 origin-center" />
            <IgnitionTitle />
            <p className="ignition-text text-white/60 font-mono text-sm max-w-lg mx-auto">
              Explore the hidden architecture of mathematics. 
              Watch the chaotic distribution of primes align into a cosmic spiral.
            </p>
          </div>
          <div className="absolute bottom-12 ignition-scroll-indicator flex flex-col items-center gap-3 animate-bounce mx-auto">
            <span className="text-xs font-mono tracking-widest uppercase text-purple-300">Scroll to Dive Deep</span>
            <div className="w-px h-16 bg-gradient-to-b from-purple-500 to-transparent"></div>
          </div>
        </div>

        {/* Phase 1: History Beats Container */}
        <div className="history-container w-full max-w-6xl px-8 py-32 flex flex-col gap-32 pointer-events-none">
          {HISTORY_BEATS.map((beat) => (
            <div key={beat.id} className="history-beat self-start w-full max-w-md bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] opacity-0">
              <div className="text-purple-500 text-[10px] font-bold tracking-widest mb-2 font-mono">{beat.id} — {beat.title}</div>
              <p className="text-white/80 font-mono text-sm leading-relaxed">{beat.desc}</p>
            </div>
          ))}
        </div>

        {/* Phase 2: Math Cards Container */}
        <div className="math-container w-full max-w-6xl px-8 py-32 flex flex-col gap-32 pointer-events-none">
          {MATH_CARDS.map((card) => (
            <div key={card.title} className="math-card self-end w-full max-w-lg bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] opacity-0">
              <div className="status-tag inline-block bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-bold tracking-widest px-2 py-1 rounded mb-4">
                {card.tag}
              </div>
              <h3 className="text-2xl font-bold mb-4">{card.title}</h3>
              <div className="formula-reveal overflow-hidden bg-black/50 p-4 rounded-lg border border-purple-500/20 mb-4 font-mono text-purple-400 whitespace-nowrap overflow-x-auto text-sm" style={{ clipPath: 'inset(0 100% 0 0)' }}>
                {card.formula}
              </div>
              <p className="text-white/60 font-mono text-xs italic">"{card.gloss}"</p>
            </div>
          ))}
        </div>

        {/* Phase 3: HUD Handoff */}
        <div className="w-full min-h-screen flex items-center justify-center p-8 pointer-events-none">
          <div className="hud-element relative w-full max-w-4xl bg-black/60 backdrop-blur-2xl border border-white/10 p-8 md:p-16 rounded-3xl flex flex-col items-center text-center opacity-0 pointer-events-auto">
            <div className="hud-bracket absolute left-0 top-0 h-full w-8 border-l-2 border-y-2 border-purple-500/30 origin-center scale-y-0 pointer-events-none" />
            <div className="hud-bracket absolute right-0 top-0 h-full w-8 border-r-2 border-y-2 border-purple-500/30 origin-center scale-y-0 pointer-events-none" />
            
            <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(168,85,247,0.2)]">
               <User size={40} className="text-white/80" />
            </div>
            
            <div className="text-purple-500 text-xs font-bold tracking-widest mb-3 font-mono">SYSTEM HUD / CREATOR DATA</div>
            <h2 className="text-white text-4xl md:text-5xl font-bold mb-2">Tarini Prashad Bharimal</h2>
            <div className="text-white/50 text-sm font-mono mb-12">Mathematical Developer</div>

            <div className="flex flex-wrap justify-center gap-8 md:gap-16 relative z-50">
              <SocialLink icon={Mail} label="Email Me" url="mailto:Krishtariniprashadbharimal@gmail.com" type="Email" />
              <SocialLink icon={Code} label="GitHub Profile" url="https://github.com/Chris-260406" type="GitHub" />
              <SocialLink icon={Camera} label="Instagram Profile" url="https://www.instagram.com/_chris.141?igsh=MTBxOWw3bHViMjRiNA==" type="Instagram" />
              <SocialLink icon={Link} label="LinkedIn Profile" url="https://www.linkedin.com/in/tarini-prashad-bharimal-7482a5315" type="LinkedIn" />
            </div>
            
            {orbitControlsEnabled && (
              <div className="absolute -bottom-10 right-0 text-white/30 font-mono text-[10px] uppercase tracking-widest flex items-center gap-2 animate-in fade-in duration-500 pointer-events-none">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                Free Orbit Mode Active
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
