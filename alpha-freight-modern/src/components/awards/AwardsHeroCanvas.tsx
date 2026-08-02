"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import { motion } from "framer-motion";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const VIOLET = "#c4b5fd";
const LAVENDER = "#ddd6fe";
const ROSE = "#fbcfe8";

function FineDust() {
  const ref = useRef<THREE.Points>(null);
  const count = 400;

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [new THREE.Color(VIOLET), new THREE.Color(LAVENDER), new THREE.Color(ROSE)];

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 3 - 2;
      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, col];
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    ref.current.rotation.y = t * 0.015;
    ref.current.position.y = Math.sin(t * 0.2) * 0.08;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.012} vertexColors transparent opacity={0.35} sizeAttenuation depthWrite={false} />
    </points>
  );
}

function FlowLines() {
  const meshRef = useRef<THREE.Mesh>(null);
  const geom = useMemo(() => new THREE.PlaneGeometry(20, 10, 80, 40), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    const pos = geom.attributes.position as THREE.BufferAttribute;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      pos.setZ(i, Math.sin(x * 0.35 + t * 0.35) * 0.12 + Math.sin(y * 0.5 + t * 0.25) * 0.06);
    }
    pos.needsUpdate = true;
    meshRef.current.rotation.x = -0.45;
    meshRef.current.position.z = -3;
  });

  return (
    <mesh ref={meshRef} geometry={geom}>
      <meshBasicMaterial color={LAVENDER} transparent opacity={0.06} wireframe />
    </mesh>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={1} />
      <FineDust />
      <FlowLines />
      <Sparkles count={40} scale={[14, 8, 4]} size={1.2} speed={0.2} opacity={0.25} color={VIOLET} />
    </>
  );
}

export function AwardsHeroCanvas() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-white" />

      {/* Soft gradient wash — no circles */}
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,1)_0%,rgba(237,233,254,0.4)_40%,rgba(252,231,243,0.25)_70%,rgba(255,255,255,1)_100%)]" />

      <motion.div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "linear-gradient(110deg, transparent 30%, rgba(196,181,253,0.12) 45%, rgba(251,207,232,0.1) 55%, transparent 70%)",
          backgroundSize: "250% 100%",
        }}
        animate={{ backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />

      <Canvas
        className="!absolute inset-0"
        camera={{ position: [0, 0, 6], fov: 55 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
      >
        <Scene />
      </Canvas>

      <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-transparent to-white/80" />
    </div>
  );
}
