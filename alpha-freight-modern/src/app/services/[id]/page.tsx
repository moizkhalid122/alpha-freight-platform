"use client";

import { use } from "react";
import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const serviceItems = [
  { 
    id: "01", 
    title: "Freight & Trucking", 
    image: "/service-detail-1.jpg",
    desc: "Comprehensive freight solutions tailored for your business needs with real-time tracking.",
    longDesc: "Alpha Freight delivers a smarter, faster, and more reliable way to move goods. Combining modern trucking, optimized routing, and real-time visibility across every shipment. Our network spans across the entire United Kingdom, providing 100% coverage with 24/7 service availability.",
    features: [
      { title: "Full Truck Load (FTL)", desc: "Dedicated vehicles for your complete shipment, ensuring maximum efficiency and security." },
      { title: "Less Than Truckload (LTL)", desc: "Cost-effective shipping for smaller cargo by sharing vehicle space without compromising on speed." },
      { title: "Partial Load", desc: "Share space for reduced shipping costs while maintaining reliable delivery timelines." },
      { title: "Intercity Transport", desc: "Long-distance freight solutions connecting all major cities across the UK." },
      { title: "Urban Delivery", desc: "Specialized city center and suburban freight solutions for complex delivery environments." },
      { title: "Tail Lift Services", desc: "Ground-level delivery solutions for locations without loading docks." }
    ],
    stats: [
      { label: "UK Coverage", value: "100%" },
      { label: "Routes Covered", value: "50K+" },
      { label: "Service", value: "24/7" }
    ]
  },
  { 
    id: "02", 
    title: "Container Transport", 
    image: "/service-detail-2.avif",
    desc: "Efficient container logistics for global and domestic shipping routes.",
    longDesc: "Streamlined container transport solutions connecting major ports with inland destinations. We handle everything from port collection to final delivery with precision and care.",
    features: [
      { title: "Port-to-Door", desc: "Seamless collection from major UK ports and delivery directly to your facility." },
      { title: "Intermodal Solutions", desc: "Combining rail and road transport for more sustainable and cost-effective container movements." },
      { title: "Specialized Equipment", desc: "Access to a wide range of chassis and handling equipment for all container types." }
    ],
    stats: [
      { label: "Ports Served", value: "All UK" },
      { label: "Efficiency", value: "99.9%" },
      { label: "Tracking", value: "Real-time" }
    ]
  },
  { 
    id: "03", 
    title: "Last-Mile Delivery", 
    image: "/service-detail-3.avif",
    desc: "Reliable and fast delivery to the final destination for ultimate customer satisfaction.",
    longDesc: "The final step of the journey is the most critical. Our last-mile delivery services ensure your products reach your customers' hands quickly, safely, and professionally.",
    features: [
      { title: "Same-Day Delivery", desc: "Urgent delivery solutions for time-sensitive packages within major urban areas." },
      { title: "White Glove Service", desc: "Premium delivery including assembly, installation, and packaging removal." },
      { title: "Customer Notifications", desc: "Automated SMS and email updates with precise delivery windows." }
    ],
    stats: [
      { label: "Success Rate", value: "98.5%" },
      { label: "Avg. Time", value: "< 24h" },
      { label: "Feedback", value: "4.9/5" }
    ]
  },
  { 
    id: "04", 
    title: "Warehouse & Storage", 
    image: "/service-detail-4.avif",
    desc: "Secure, climate-controlled storage solutions with intelligent inventory management.",
    longDesc: "Beyond transport, we provide comprehensive storage solutions. Our modern warehouses are equipped with advanced security and climate control systems to protect your valuable inventory.",
    features: [
      { title: "Inventory Management", desc: "Real-time stock tracking and reporting through our integrated WMS platform." },
      { title: "Pick & Pack", desc: "Efficient order fulfillment services tailored to your specific e-commerce or retail needs." },
      { title: "Short & Long Term", desc: "Flexible storage contracts that scale with your business requirements." }
    ],
    stats: [
      { label: "Storage Space", value: "1M+ sqft" },
      { label: "Security", value: "24/7" },
      { label: "Accuracy", value: "99.99%" }
    ]
  },
  { 
    id: "05", 
    title: "Express Distribution", 
    image: "/service-detail-5.avif",
    desc: "Time-critical shipping solutions for your most urgent freight requirements.",
    longDesc: "When every minute counts, our express distribution network delivers. We prioritize your most urgent shipments with dedicated resources and expedited routing.",
    features: [
      { title: "Next-Day Guaranteed", desc: "Reliable next-day delivery across the UK for all package sizes." },
      { title: "Priority Handling", desc: "Specialized workflows to ensure express shipments move through our network with zero delays." },
      { title: "Emergency Logistics", desc: "On-demand transport solutions for critical supply chain disruptions." }
    ],
    stats: [
      { label: "On-Time", value: "99.5%" },
      { label: "Network Speed", value: "Fastest" },
      { label: "Reliability", value: "100%" }
    ]
  },
];

export default function ServicePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const service = serviceItems.find(item => item.id === resolvedParams.id) || serviceItems[0];

  return (
    <div className="relative min-h-screen bg-black selection:bg-[#BFFF07] selection:text-black overflow-x-hidden">
      <Navbar />
      
      <main className="pt-24">
        {/* Hero Section */}
        <section className="relative h-[60vh] w-full overflow-hidden flex flex-col justify-center">
          <div className="absolute inset-0 z-0">
            <Image
              src={service.image}
              alt={service.title}
              fill
              className="object-cover opacity-60"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black" />
          </div>

          <div className="max-w-[1800px] mx-auto px-6 lg:px-12 relative z-20 w-full">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl"
            >
              <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-[0.3em] text-[#BFFF07] mb-6">
                <span>Service {service.id}</span>
              </div>
              <h1 className="text-5xl md:text-8xl font-medium text-white leading-none tracking-tight mb-8 uppercase">
                {service.title}
              </h1>
              <p className="text-white/70 text-lg md:text-xl max-w-2xl font-light leading-relaxed">
                {service.desc}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Demand Section (from screenshot) */}
        <section className="py-32 bg-white">
          <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-24">
              {/* Left Column */}
              <div className="space-y-12">
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-4xl md:text-6xl font-medium text-black leading-tight tracking-tight"
                >
                  Global supply chains demand <br /> more than just transport
                </motion.h2>
                
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-gray-100"
                >
                  <Image
                    src="/service-detail-2.avif"
                    alt="Global Logistics Hub"
                    fill
                    className="object-cover"
                  />
                </motion.div>
              </div>

              {/* Right Column */}
              <div className="flex flex-col justify-between pt-4">
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="space-y-8 max-w-xl"
                >
                  <p className="text-gray-700 text-lg leading-relaxed">
                    We leverage advanced AI-driven route planning and IoT-enabled solutions to connect key logistics hubs. We manage complexity, ensure compliance, and accelerate sustainable growth for your road freight operations.
                  </p>
                  <p className="text-gray-700 text-lg leading-relaxed">
                    Our belief is that trucking must be a strategic, telematics-driven differentiator, not just a cost center. We implement digital frameworks that scale precisely with your FTL and LTL global ambitions.
                  </p>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-gray-100 mt-12 lg:mt-0"
                >
                  <Image
                    src="/service-detail-4.avif"
                    alt="Modern Warehouse Logistics"
                    fill
                    className="object-cover"
                  />
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-32 bg-white">
          <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
            <div className="flex flex-col lg:flex-row gap-20">
              {/* Left Column - Description */}
              <div className="lg:w-1/2 space-y-12">
                <div>
                  <h2 className="text-black text-3xl md:text-5xl font-medium tracking-tight mb-8">
                    Overview
                  </h2>
                  <p className="text-gray-600 text-lg leading-relaxed font-medium">
                    {service.longDesc}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {service.stats.map((stat, i) => (
                    <div key={i} className="p-8 bg-gray-50 rounded-2xl">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{stat.label}</p>
                      <p className="text-3xl font-bold text-black">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column - Features */}
              <div className="lg:w-1/2">
                <h2 className="text-black text-3xl md:text-5xl font-medium tracking-tight mb-12">
                  Key Features
                </h2>
                <div className="grid gap-6">
                  {service.features.map((feature, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      viewport={{ once: true }}
                      className="p-8 border border-gray-100 rounded-2xl hover:border-black/10 hover:bg-gray-50 transition-all duration-300"
                    >
                      <h3 className="text-xl font-bold text-black mb-4">{feature.title}</h3>
                      <p className="text-gray-500 font-medium leading-relaxed">
                        {feature.desc}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 bg-[#111]">
          <div className="max-w-[1800px] mx-auto px-6 lg:px-12 text-center">
            <h2 className="text-4xl md:text-6xl font-medium text-white tracking-tight mb-12 uppercase">
              Ready to get started?
            </h2>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <Link
                href="/contact"
                className="px-10 py-4 bg-[#BFFF07] text-black font-bold uppercase tracking-widest rounded-xl hover:bg-white transition-all duration-300"
              >
                Request a Quote
              </Link>
              <Link
                href="/auth/signup"
                className="px-10 py-4 border border-white/20 text-white font-bold uppercase tracking-widest rounded-xl hover:bg-white hover:text-black transition-all duration-300"
              >
                Register as Carrier
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-black pt-32 pb-12 overflow-hidden relative border-t border-white/5">
        <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-8 md:mb-0">
              <div className="relative w-8 h-8">
                <Image
                  src="/logo.png"
                  alt="Alpha Freight Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-black tracking-tighter text-white uppercase">
                Alpha Freight
              </span>
            </div>
            <p className="text-white/20 text-[10px] font-bold tracking-widest uppercase">
              &copy; 2026 ALPHA FREIGHT SOLUTIONS LIMITED. ALL RIGHTS RESERVED.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
