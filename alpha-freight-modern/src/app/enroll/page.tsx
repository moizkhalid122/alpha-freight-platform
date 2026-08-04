"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, GraduationCap } from "lucide-react";

import Navbar from "@/components/Navbar";
import { CinematicCTA, Footer } from "@/components/Footer";
import AcademyEnrollmentForm from "@/components/academy/AcademyEnrollmentForm";

const courses = [
  {
    id: "cpc",
    title: "CPC Training Course",
    price: "£149",
    duration: "35 Hours",
    description: "Essential certification for professional HGV and bus drivers in the UK.",
  },
  {
    id: "safety",
    title: "Safety & Compliance",
    price: "£99",
    duration: "1 Day",
    description: "Master the latest safety regulations and compliance standards for UK roads.",
  },
  {
    id: "load-securing",
    title: "Load Securing Cert",
    price: "£129",
    duration: "2 Days",
    description: "Specialized training on securing cargo for safe and compliant transport.",
  },
];

export default function EnrollPage() {
  const [selectedCourse, setSelectedCourse] = useState(courses[0].id);
  const selected = courses.find((course) => course.id === selectedCourse) ?? courses[0];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#BFFF07] selection:text-black overflow-x-hidden">
      <Navbar />

      <main className="pt-28 md:pt-32">
        <section className="relative pb-20 md:pb-28 overflow-hidden border-b border-white/10">
          <div className="absolute inset-0">
            <Image src="/how-1.jpg" alt="" fill className="object-cover opacity-25" />
            <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-black" />
          </div>

          <div className="relative max-w-[1200px] mx-auto px-5 md:px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="max-w-3xl"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#BFFF07] mb-6">
                Academy Enrollment
              </p>
              <h1 className="text-5xl md:text-[5rem] font-medium leading-[0.92] tracking-tighter uppercase">
                Start your next
                <br />
                <span className="text-white/25">certification.</span>
              </h1>
              <p className="mt-6 text-white/45 text-lg leading-relaxed max-w-2xl">
                Choose your course, submit your enrollment request, and our academy team will confirm your schedule, payment options, and onboarding details.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-20 md:py-28 bg-white text-black">
          <div className="max-w-[1200px] mx-auto px-5 md:px-6 lg:px-12 grid lg:grid-cols-[1fr_420px] gap-10 items-start">
            <div className="space-y-5">
              {courses.map((course, index) => {
                const isSelected = selectedCourse === course.id;

                return (
                  <motion.button
                    key={course.id}
                    type="button"
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06, duration: 0.5 }}
                    viewport={{ once: true }}
                    onClick={() => setSelectedCourse(course.id)}
                    className={`w-full text-left rounded-[2rem] border p-7 md:p-8 transition-all ${
                      isSelected
                        ? "border-black bg-black text-white shadow-[0_25px_60px_rgba(0,0,0,0.18)]"
                        : "border-black/10 bg-[#f7f7f4] hover:border-black/20"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isSelected ? "text-[#BFFF07]" : "text-black/35"}`}>
                          {course.duration}
                        </p>
                        <h2 className="mt-2 text-2xl md:text-3xl font-medium tracking-tight">{course.title}</h2>
                      </div>
                      <p className="text-3xl font-black tracking-tight">{course.price}</p>
                    </div>
                    <p className={`mt-4 text-sm leading-relaxed ${isSelected ? "text-white/55" : "text-black/50"}`}>
                      {course.description}
                    </p>
                  </motion.button>
                );
              })}

              <Link
                href="/enroll/bundle"
                className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-black/45 hover:text-black transition-colors"
              >
                Prefer the full driver bundle?
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="rounded-[2rem] border border-black/10 bg-[#f7f7f4] p-7 md:p-8 lg:sticky lg:top-32"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-[#BFFF07]">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/35">Enrollment form</p>
                  <p className="text-lg font-medium">Reserve your place</p>
                </div>
              </div>

              <AcademyEnrollmentForm
                enrollmentType="course"
                courseId={selected.id}
                courseTitle={selected.title}
              />
            </motion.div>
          </div>
        </section>
      </main>

      <CinematicCTA
        title="Train with the Alpha Freight Academy"
        subtitle="Build certified talent"
        buttonText="View Courses"
        buttonHref="/academy#courses"
      />
      <Footer />
    </div>
  );
}
