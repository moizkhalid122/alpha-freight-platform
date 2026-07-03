"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { motion } from "framer-motion";
import { useMemo, useRef } from "react";
import type { Group } from "three";
import { ArrowRight, Sparkles } from "lucide-react";

function SceneCore({ accent = "#2563EB" }: { accent?: string }) {
  const clusterRef = useRef<Group>(null);
  const ringRef = useRef<Group>(null);

  const particles = useMemo(
    () =>
      Array.from({ length: 16 }, (_, index) => ({
        key: index,
        position: [
          (Math.sin(index * 1.9) * 2.6) / 1.35,
          (Math.cos(index * 2.4) * 1.6) / 1.35,
          (Math.sin(index * 3.1) * 1.4) / 1.35,
        ] as [number, number, number],
        scale: 0.05 + (index % 4) * 0.018,
      })),
    []
  );

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (clusterRef.current) {
      clusterRef.current.rotation.y = time * 0.28;
      clusterRef.current.rotation.x = Math.sin(time * 0.5) * 0.12;
      clusterRef.current.position.y = Math.sin(time * 0.8) * 0.08;
    }

    if (ringRef.current) {
      ringRef.current.rotation.z = time * 0.22;
      ringRef.current.rotation.x = Math.cos(time * 0.35) * 0.18;
    }
  });

  return (
    <>
      <color attach="background" args={["#f8fbff"]} />
      <ambientLight intensity={1.35} />
      <directionalLight position={[3, 4, 5]} intensity={1.25} color="#ffffff" />
      <pointLight position={[-4, -2, 3]} intensity={0.9} color={accent} />

      <group ref={clusterRef}>
        <Float speed={1.6} rotationIntensity={0.55} floatIntensity={0.85}>
          <mesh position={[0, 0.05, 0]}>
            <icosahedronGeometry args={[0.7, 0]} />
            <meshStandardMaterial color={accent} roughness={0.12} metalness={0.45} />
          </mesh>
        </Float>

        <Float speed={1.3} rotationIntensity={0.7} floatIntensity={1.05}>
          <mesh position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.08, 0.045, 24, 120]} />
            <meshStandardMaterial color="#0f172a" roughness={0.25} metalness={0.55} />
          </mesh>
        </Float>

        <Float speed={1.9} rotationIntensity={0.9} floatIntensity={0.95}>
          <mesh position={[0.9, 0.48, -0.28]} rotation={[0.7, 0.8, 0.2]}>
            <boxGeometry args={[0.24, 0.24, 0.24]} />
            <meshStandardMaterial color="#f97316" roughness={0.18} metalness={0.42} />
          </mesh>
        </Float>

        <Float speed={1.4} rotationIntensity={0.55} floatIntensity={0.75}>
          <mesh position={[-0.88, -0.44, 0.2]}>
            <sphereGeometry args={[0.16, 32, 32]} />
            <meshStandardMaterial color="#38bdf8" roughness={0.15} metalness={0.32} />
          </mesh>
        </Float>

        <group ref={ringRef}>
          {particles.map((particle) => (
            <mesh key={particle.key} position={particle.position}>
              <sphereGeometry args={[particle.scale, 16, 16]} />
              <meshStandardMaterial color={particle.key % 3 === 0 ? "#cbd5e1" : accent} roughness={0.2} metalness={0.2} />
            </mesh>
          ))}
        </group>
      </group>
    </>
  );
}

type PremiumThreeEmptyStateProps = {
  badge?: string;
  title: string;
  description: string;
  accent?: string;
  ctaLabel?: string;
};

export default function PremiumThreeEmptyState({
  badge = "Alpha Freight Insight",
  title,
  description,
  accent = "#2563EB",
  ctaLabel,
}: PremiumThreeEmptyStateProps) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-slate-100 bg-gradient-to-br from-white via-slate-50 to-blue-50/40 p-6 sm:p-8 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.18)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.12),_transparent_36%),radial-gradient(circle_at_bottom_left,_rgba(249,115,22,0.12),_transparent_28%)]" />
      <div className="relative z-10 grid items-center gap-6 lg:grid-cols-[220px,1fr]">
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="mx-auto h-[210px] w-full max-w-[240px] rounded-[26px] border border-white/80 bg-white/80 p-3 shadow-inner backdrop-blur"
        >
          <Canvas camera={{ position: [0, 0, 4.3], fov: 42 }}>
            <SceneCore accent={accent} />
          </Canvas>
        </motion.div>

        <div className="text-center lg:text-left">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-slate-600 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" style={{ color: accent }} />
            {badge}
          </div>
          <h3 className="text-2xl font-black tracking-tight text-slate-900">{title}</h3>
          <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-7 text-slate-500 lg:mx-0">{description}</p>
          {ctaLabel ? (
            <div className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-700 shadow-sm">
              <span>{ctaLabel}</span>
              <ArrowRight className="h-3.5 w-3.5" style={{ color: accent }} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
