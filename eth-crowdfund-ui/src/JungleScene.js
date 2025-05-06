// src/JungleScene.js
import React, { useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

function SwayingVine({ textureURL, position }) {
  const vineRef = useRef();
  const texture = useLoader(THREE.TextureLoader, textureURL);

  useFrame(({ clock }) => {
    if (vineRef.current) {
      vineRef.current.rotation.z = Math.sin(clock.elapsedTime) * 0.03; // gentle sway
    }
  });

  return (
    <mesh ref={vineRef} position={position}>
      <planeGeometry args={[2, 4]} />
      <meshBasicMaterial map={texture} transparent />
    </mesh>
  );
}

export default function JungleScene() {
  return (
    <Canvas
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: -1,
        width: '100vw',
        height: '100vh',
      }}
      camera={{ position: [0, 0, 5], fov: 75 }}
    >
      <color attach="background" args={['#cde8c7']} />
      <fog attach="fog" args={['#cde8c7', 5, 20]} />
      <Stars radius={100} depth={50} count={1000} factor={4} fade />

      <ambientLight intensity={0.5} />

      {/* Add vines */}
      <SwayingVine textureURL="/vines.png" position={[-3, 0, 0]} />
      <SwayingVine textureURL="/vines.png" position={[3, 0, 0]} />
    </Canvas>
  );
}
