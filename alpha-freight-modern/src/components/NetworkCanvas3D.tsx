"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";
import { Float, Points, PointMaterial, Line } from "@react-three/drei";

function NetworkGlobe() {
  const groupRef = useRef<THREE.Group>(null);
  
  // Create points for nodes
  const nodes = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 40; i++) {
      const phi = Math.acos(-1 + (2 * i) / 40);
      const theta = Math.sqrt(40 * Math.PI) * phi;
      pts.push(new THREE.Vector3().setFromSphericalCoords(2, phi, theta));
    }
    return pts;
  }, []);

  // Create connection lines between some nodes
  const connections = useMemo(() => {
    const lines = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].distanceTo(nodes[j]) < 1.5) {
          lines.push([nodes[i], nodes[j]]);
        }
      }
    }
    return lines;
  }, [nodes]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.15;
      groupRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.1) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Subtle sphere backgroun */}
      <mesh>
        <sphereGeometry args={[1.98, 32, 32]} />
        <meshStandardMaterial color="#BFFF07" transparent opacity={0.03} />
      </mesh>

      {/* Nodes */}
      {nodes.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshBasicMaterial color="#BFFF07" />
          <pointLight distance={0.5} intensity={0.5} color="#BFFF07" />
        </mesh>
      ))}

      {/* Connection Lines */}
      {connections.map((points, i) => (
        <Line
          key={i}
          points={points}
          color="#BFFF07"
          lineWidth={0.5}
          transparent
          opacity={0.2}
        />
      ))}

      {/* Floating data particles */}
      <Points limit={1000}>
        <PointMaterial
          transparent
          color="#BFFF07"
          size={0.02}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.4}
        />
        {Array.from({ length: 100 }).map((_, i) => {
          const phi = Math.random() * Math.PI * 2;
          const theta = Math.random() * Math.PI;
          const r = 2 + Math.random() * 0.5;
          return (
            <primitive
              key={i}
              object={new THREE.Vector3().setFromSphericalCoords(r, theta, phi)}
              attach="positions"
            />
          );
        })}
      </Points>
    </group>
  );
}

export default function NetworkCanvas3D() {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#BFFF07" />
        <NetworkGlobe />
      </Canvas>
    </div>
  );
}
