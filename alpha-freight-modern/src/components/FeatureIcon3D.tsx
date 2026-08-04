"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";
import { Float, MeshDistortMaterial, Sphere, MeshWobbleMaterial } from "@react-three/drei";

// 1. Data Driven Intelligence - Floating nodes with connections
function DataIntelligenceIcon({ color = "#000000" }) {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.5;
      meshRef.current.rotation.z = state.clock.getElapsedTime() * 0.2;
    }
  });

  return (
    <group ref={meshRef}>
      <Sphere args={[0.4, 32, 32]}>
        <MeshDistortMaterial color={color} speed={2} distort={0.3} radius={1} />
      </Sphere>
      <group>
        {[...Array(5)].map((_, i) => (
          <mesh key={i} position={[
            Math.cos(i * 1.2) * 0.8,
            Math.sin(i * 1.2) * 0.8,
            Math.sin(i * 1.5) * 0.4
          ]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color={color} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// 2. Global Network - 3D Globe (requested)
function GlobeIcon({ color = "#000000" }) {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Main Sphere */}
      <mesh>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial color={color} wireframe transparent opacity={0.2} />
      </mesh>
      
      {/* Longitude lines */}
      {[...Array(6)].map((_, i) => (
        <mesh key={`lon-${i}`} rotation={[0, (i * Math.PI) / 3, 0]}>
          <torusGeometry args={[0.8, 0.01, 16, 100]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
      
      {/* Latitude lines */}
      {[...Array(3)].map((_, i) => (
        <mesh key={`lat-${i}`} position={[0, (i - 1) * 0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[Math.sqrt(0.8**2 - ((i-1)*0.4)**2), 0.01, 16, 100]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}

      {/* Pulsing Dots */}
      {[...Array(8)].map((_, i) => {
        const x = Math.sin(i * 1.5) * Math.cos(i) * 0.8;
        const y = Math.cos(i * 1.5) * 0.8;
        const z = Math.sin(i * 1.5) * Math.sin(i) * 0.8;
        return (
          <Float key={`dot-${i}`} speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <mesh position={[x, y, z]}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshStandardMaterial color={color} />
            </mesh>
          </Float>
        );
      })}
    </group>
  );
}

// 3. Absolute Transparency - Interlocking Rings
function TransparencyIcon({ color = "#ffffff" }) {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.4;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.6;
    }
  });

  return (
    <group ref={meshRef}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.6, 0.05, 16, 100]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.6, 0.05, 16, 100]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Sphere args={[0.3, 32, 32]}>
        <MeshWobbleMaterial color={color} speed={1} factor={0.6} transparent opacity={0.5} />
      </Sphere>
    </group>
  );
}

// 4. Scalable Infrastructure - Geometric Cube/Structure
function InfrastructureIcon({ color = "#000000" }) {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.5;
      const scale = 1 + Math.sin(state.clock.getElapsedTime() * 2) * 0.1;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group ref={meshRef}>
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={color} wireframe />
      </mesh>
      <mesh>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color={color} wireframe />
      </mesh>
      {[...Array(8)].map((_, i) => (
        <mesh key={i} position={[
          (i & 1 ? 1 : -1) * 0.5,
          (i & 2 ? 1 : -1) * 0.5,
          (i & 4 ? 1 : -1) * 0.5
        ]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}

type IconType = "data" | "globe" | "transparency" | "infrastructure";

export default function FeatureIcon3D({ type, color }: { type: IconType; color?: string }) {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} />
        
        {type === "data" && <DataIntelligenceIcon color={color} />}
        {type === "globe" && <GlobeIcon color={color} />}
        {type === "transparency" && <TransparencyIcon color={color} />}
        {type === "infrastructure" && <InfrastructureIcon color={color} />}
      </Canvas>
    </div>
  );
}
