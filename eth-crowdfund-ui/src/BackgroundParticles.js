import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'

function Particles() {
  const ref = useRef()
  const sphere = new THREE.SphereGeometry(1.2, 64, 64)
  const positions = Array.from({ length: 200 }, () => [
    (Math.random() - 0.5) * 20,
    Math.random() * 15,
    (Math.random() - 0.5) * 20
  ])

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.001
    }
  })

  return (
    <Points ref={ref} positions={positions.flat()} stride={3}>
      <PointMaterial
        color="#ffffff"
        size={0.05}
        sizeAttenuation
        transparent
        depthWrite={false}
      />
    </Points>
  )
}

export default function BackgroundParticles() {
  return (
    <div style={{ position: 'fixed', width: '100%', height: '100%', zIndex: -1 }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <Particles />
      </Canvas>
    </div>
  )
}
