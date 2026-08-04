"use client";

import { useState, useEffect, useRef, Suspense, type ReactNode } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import NetworkCanvas3D from "@/components/NetworkCanvas3D";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { 
  Search, 
  ChevronRight, 
  ChevronDown, 
  Book, 
  Code, 
  Shield, 
  Zap, 
  Terminal, 
  Truck, 
  FileText, 
  CreditCard, 
  Globe, 
  Info,
  ExternalLink,
  Menu,
  X,
  PlayCircle,
  ArrowRight,
  Mail,
  Copy,
  Check,
  Key,
  Lock,
  Braces,
  Webhook
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { Footer, CinematicCTA } from "@/components/Footer";

// Placeholder Icons
const BarChart3 = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
);
const Layers = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
);
const Cpu = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>
);

// Documentation Content Structure
const documentation = [
  {
    category: "Getting Started",
    items: [
      { id: "overview", title: "Platform Overview", icon: Info },
      { id: "account-setup", title: "Account Setup", icon: Zap },
      { id: "vetting", title: "Carrier Vetting", icon: Shield },
    ]
  },
  {
    category: "Carrier Guides",
    items: [
      { id: "finding-loads", title: "Finding Loads", icon: Search },
      { id: "bidding", title: "Smart Bidding", icon: Layers },
      { id: "pod-upload", title: "Digital POD Upload", icon: FileText },
      { id: "payouts", title: "7-Day Payouts", icon: CreditCard },
    ]
  },
  {
    category: "Supplier Portal",
    items: [
      { id: "posting-loads", title: "Posting Freight", icon: Truck },
      { id: "tracking", title: "Real-time Tracking", icon: Globe },
      { id: "analytics", title: "Performance Data", icon: BarChart3 },
    ]
  },
  {
    category: "Developer Hub",
    items: [
      { id: "api-auth", title: "Authentication", icon: Code },
      { id: "webhooks", title: "Webhooks", icon: Terminal },
      { id: "sdks", title: "SDKs & Libraries", icon: Cpu },
    ]
  }
];

// Mapping for dynamic "On this page" headings
const pageSections: Record<string, string[]> = {
  overview: ["Introduction", "AI Matching Engine", "The Ecosystem", "Core Infrastructure", "Compliance", "Innovation Roadmap", "Our Commitment"],
  "account-setup": ["Onboarding Guide", "Profile Initialization", "Corporate Credentialing", "Verification Protocol", "Ecosystem Integration"],
  vetting: ["Carrier Vetting", "Insurance Requirements", "GIT Insurance", "Public Liability", "Operator's License"],
  "finding-loads": ["Finding Loads", "AI Powered Matching", "Marketplace Filters", "Booking Workflows"],
  "posting-loads": ["Freight Initiation", "Bulk Upload Protocol", "Dynamic Market Pricing", "AI Carrier Allocation"],
  "tracking": ["Live Control Tower", "GPS Telemetry", "Predictive ETA", "Incident Management"],
  "analytics": ["Performance Bento", "Carrier Scorecards", "Lane Optimization", "Custom Reporting"],
  "pod-upload": ["Digital POD", "Upload Workflow", "Real-time Sync", "Status Notifications"],
  "payouts": ["Financial Edge", "Settlement Workflow", "Security & Transparency"],
  "api-auth": ["Authentication", "OAuth 2.0 Flow", "Environments", "Token Management", "Rate Limits"],
  "webhooks": ["Event Types", "Payload Schema", "Security Protocol", "Retry Policy", "Testing Tools"],
  "sdks": ["Quick Start", "Node.js SDK", "Python Library", "Go Package", "Community Wrappers"]
};

const VALID_TABS = documentation.flatMap((group) => group.items.map((item) => item.id));

function slugifySection(section: string) {
  return section.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function DocumentationPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  
  const { scrollYProgress } = useScroll({ container: mainRef });

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && VALID_TABS.includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const selectTab = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
    router.replace(`/docs?tab=${id}`, { scroll: false });
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [activeTab]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white selection:bg-[#BFFF07] selection:text-black">
      {/* Top Header */}
      <header className="h-16 border-b border-black/5 bg-white flex items-center justify-between px-6 z-50 sticky top-0 shrink-0">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative w-8 h-8">
              <Image src="/logo.png" alt="Logo" fill className="object-contain" />
            </div>
            <span className="text-sm font-black tracking-tighter uppercase">ALPHA FREIGHT</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-1">
            {["Documentation", "API Reference", "Changelog"].map((nav) => (
              <button 
                key={nav}
                className={`px-4 py-1 text-[13px] font-bold rounded-full transition-all ${
                  nav === "Documentation" ? "bg-black text-white" : "text-black/40 hover:text-black"
                }`}
              >
                {nav}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20" />
            <input 
              type="text" 
              placeholder="Search guides..."
              className="bg-black/[0.03] border border-black/5 rounded-full py-2 pl-10 pr-4 text-xs font-medium focus:outline-none focus:border-black/20 w-64 transition-all"
            />
          </div>
          <Link href="/auth/login" className="text-[13px] font-bold text-black hover:opacity-60 transition-opacity">
            Sign In
          </Link>
          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Main Documentation Layout */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {/* Progress Bar */}
        <motion.div className="fixed top-16 left-0 right-0 h-[2px] bg-[#BFFF07] origin-left z-50" style={{ scaleX }} />

        {mobileMenuOpen && (
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 top-16 z-30 bg-black/20 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Left Sidebar - Navigation */}
        <aside
          className={`
          z-40 shrink-0 w-72 border-r border-black/5 bg-white p-8 overflow-y-auto
          md:relative md:h-full md:translate-x-0
          fixed top-16 bottom-0 left-0 transition-transform duration-300
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        >
          <div className="space-y-10 pb-20">
            {documentation.map((group) => (
              <div key={group.category}>
                <h4 className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] mb-4">
                  {group.category}
                </h4>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => selectTab(item.id)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-bold transition-all
                        ${activeTab === item.id 
                          ? "bg-black text-white shadow-lg" 
                          : "text-black/40 hover:bg-black/[0.03] hover:text-black"}
                      `}
                    >
                      <item.icon className={`w-4 h-4 ${activeTab === item.id ? "text-[#BFFF07]" : "opacity-40"}`} />
                      {item.title}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content Area */}
        <main ref={mainRef} className="min-h-0 flex-1 overflow-y-auto bg-white">
          <div className="max-w-4xl mx-auto px-8 md:px-16 py-16">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Dynamic Content Switching Based on activeTab */}
                {activeTab === "overview" && <OverviewContent />}
                {activeTab === "account-setup" && <AccountSetupContent />}
                {activeTab === "vetting" && <VettingContent />}
                {activeTab === "finding-loads" && <FindingLoadsContent />}
                {activeTab === "bidding" && <SmartBiddingContent />}
                {activeTab === "posting-loads" && <PostingFreightContent />}
                {activeTab === "tracking" && <TrackingContent />}
                {activeTab === "analytics" && <AnalyticsContent />}
                {activeTab === "pod-upload" && <PODUploadContent />}
                {activeTab === "payouts" && <PayoutsContent />}
                {activeTab === "api-auth" && <APIAuthContent />}
                {activeTab === "webhooks" && <WebhooksContent />}
                {activeTab === "sdks" && <SDKsContent />}
                
                {/* Footer of Content */}
                <div className="mt-32 pt-12 border-t border-black/5 flex justify-between items-center text-sm text-black/40 font-bold uppercase tracking-widest">
                  <div>Last updated: June 2026</div>
                  <div className="flex gap-4">
                    <button className="hover:text-black transition-colors">Was this helpful?</button>
                    <div className="flex gap-2">
                      <button className="w-8 h-8 rounded-lg bg-black/[0.03] flex items-center justify-center hover:bg-[#BFFF07] hover:text-black transition-all">👍</button>
                      <button className="w-8 h-8 rounded-lg bg-black/[0.03] flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">👎</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Right Sidebar - On This Page */}
        <aside className="hidden h-full w-72 shrink-0 overflow-y-auto border-l border-black/5 bg-white p-8 xl:block">
          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-black uppercase tracking-[0.2em]">On this page</h4>
            <nav className="space-y-3">
              {(pageSections[activeTab] || ["Introduction", "Overview"]).map((section) => (
                <button 
                  key={section}
                  type="button"
                  onClick={() => document.getElementById(slugifySection(section))?.scrollIntoView({ behavior: "smooth" })}
                  className="block text-[12px] font-bold text-black/40 hover:text-[#BFFF07] transition-colors uppercase tracking-tight text-left"
                >
                  {section}
                </button>
              ))}
            </nav>
            
            <div className="pt-12">
              <div className="p-6 rounded-[2rem] bg-black text-white space-y-4">
                <h5 className="text-sm font-bold tracking-tight">Need dedicated help?</h5>
                <p className="text-[11px] text-white/40 leading-relaxed uppercase font-black tracking-widest">Our team is available 24/7 for technical support.</p>
                <Link href="/support" className="flex items-center gap-2 text-[#BFFF07] text-xs font-bold uppercase tracking-widest group">
                  Support Center <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function DocumentationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <DocumentationPageContent />
    </Suspense>
  );
}

// --- Content Components ---

function OverviewContent() {
  return (
    <div className="prose prose-slate max-w-none">
      <div className="space-y-4 mb-12">
        <div className="text-[10px] font-black text-[#BFFF07] uppercase tracking-[0.4em] bg-black inline-block px-3 py-1 rounded-full">Alpha Freight v2.0</div>
        <h1 className="text-5xl md:text-7xl font-medium text-black tracking-tighter uppercase leading-none">
          The Future of <br /> <span className="text-black/20 italic">Logistics.</span>
        </h1>
      </div>
      
      <p className="text-xl text-black/60 leading-relaxed font-medium mb-12">
        Alpha Freight represents the pinnacle of digital logistics transformation. We have engineered a unified ecosystem that harmonizes the complexities of freight brokerage through advanced artificial intelligence and high-fidelity data streams. Our platform serves as the intelligent bridge connecting the UK’s most reliable carriers with high-volume suppliers, ensuring every shipment is executed with surgical precision.
      </p>

      {/* Core Values Grid */}
      <div className="grid md:grid-cols-2 gap-6 my-16">
        <div className="p-8 rounded-[2.5rem] bg-[#BFFF07] text-black space-y-6">
          <Zap className="w-10 h-10" />
          <h3 className="text-2xl font-black uppercase tracking-tighter">AI Matching Engine</h3>
          <p className="text-sm font-bold leading-relaxed uppercase opacity-60">
            Utilizing multi-dimensional data points—including real-time vehicle telemetry, historical route efficiency, and predictive capacity modeling—our system identifies and assigns the optimal carrier for any given load in under 60 seconds.
          </p>
        </div>
        <div className="p-8 rounded-[2.5rem] bg-black text-white space-y-6">
          <Shield className="w-10 h-10 text-[#BFFF07]" />
          <h3 className="text-2xl font-black uppercase tracking-tighter">Verified Trust</h3>
          <p className="text-sm font-bold leading-relaxed uppercase opacity-40">
            Every participant in our network undergoes a rigorous 5-step vetting process, ensuring that every load is handled by a fully insured and compliant professional logistics provider.
          </p>
        </div>
      </div>

      <h2 className="text-3xl font-bold text-black uppercase tracking-tighter mt-20 mb-8 border-b border-black/5 pb-4">The Ecosystem A-Z</h2>
      
      <div className="space-y-16">
        {/* Section 1: Carriers */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-[#BFFF07]">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight">Value for Carriers</h3>
          </div>
          <p className="text-gray-500 font-medium leading-relaxed">
            For logistics providers, Alpha Freight is a catalyst for scale. We provide instant access to a premium load board, optimized for your specific fleet capabilities. Our industry-disrupting 7-Day Payout Guarantee ensures your capital remains liquid, while our native mobile application digitizes the entire delivery workflow—from route guidance to instantaneous POD synchronization.
          </p>
          <ul className="grid sm:grid-cols-2 gap-4 list-none p-0">
            {["Instant Load Booking", "7-Day Payout Guarantee", "Dynamic Route Guidance", "Advanced Smart Bidding"].map(item => (
              <li key={item} className="flex items-center gap-3 p-4 rounded-xl bg-black/[0.02] border border-black/5 font-bold text-[10px] uppercase tracking-widest text-black/60">
                <ChevronRight className="w-4 h-4 text-[#BFFF07]" /> {item}
              </li>
            ))}
          </ul>
          
          {/* Added Professional Image Section */}
          <div className="mt-8 space-y-4">
            <div className="text-[10px] font-black text-black/20 uppercase tracking-[0.2em]">Step 2. Go to "Edit Fields"</div>
            <div className="relative w-full rounded-[2.5rem] overflow-hidden border border-black/5 shadow-2xl bg-zinc-50">
              <Image 
                src="/guide-image.jpg" 
                alt="System Interface Guide" 
                width={1920}
                height={1080}
                className="w-full h-auto block"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Shippers/Suppliers */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-[#BFFF07]">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight">Operational Excellence for Shippers</h3>
          </div>
          <p className="text-gray-500 font-medium leading-relaxed">
            We empower shippers with total transparency. Our enterprise-grade dashboard provides a single pane of glass for managing national freight operations. With live GPS tracking accurate to within meters and automated status notifications, you can monitor your supply chain health in real-time, backed by comprehensive carrier performance analytics.
          </p>
          <ul className="grid sm:grid-cols-2 gap-4 list-none p-0">
            {["Real-time GPS Tracking", "Automated POD Reconciliation", "Carrier Performance Analytics", "Frictionless Load Posting"].map(item => (
              <li key={item} className="flex items-center gap-3 p-4 rounded-xl bg-black/[0.02] border border-black/5 font-bold text-[10px] uppercase tracking-widest text-black/60">
                <ChevronRight className="w-4 h-4 text-[#BFFF07]" /> {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Section 3: Technology */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-[#BFFF07]">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight">Core Infrastructure</h3>
          </div>
          <p className="text-gray-500 font-medium leading-relaxed">
            Our platform is engineered using a high-concurrency RESTful API architecture and secure WebSocket telemetry. We prioritize data integrity and enterprise-grade security (OAuth 2.0), ensuring your logistics intelligence is both protected and actionable.
          </p>
          <div className="bg-black p-8 rounded-[2rem] text-white/40 font-mono text-xs uppercase tracking-[0.2em] leading-loose">
            <span className="text-[#BFFF07]">// ALPHA CORE ENGINE ACTIVE</span> <br />
            {">"} LATENCY: 45MS AVG <br />
            {">"} TELEMETRY: REAL-TIME SYNC <br />
            {">"} CRYPTOGRAPHIC PAYOUT VERIFICATION <br />
            {">"} SYSTEM UPTIME: 99.99%
          </div>
        </div>

        {/* New Section: Compliance & Safety */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#BFFF07] flex items-center justify-center text-black">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight">Compliance & Risk Management</h3>
          </div>
          <p className="text-gray-500 font-medium leading-relaxed">
            Safety is built into the core of our operations. We maintain a zero-tolerance policy for compliance gaps. Every vehicle on our platform is tracked against active GIT (Goods in Transit) and Public Liability insurance certificates, ensuring total risk mitigation for our shipping partners.
          </p>
        </div>

        {/* New Section: Future Roadmap */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-[#BFFF07]">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight">Innovation Roadmap</h3>
          </div>
          <p className="text-gray-500 font-medium leading-relaxed">
            Alpha Freight is evolving into an autonomous logistics coordinator. Our upcoming features include predictive maintenance alerts for carriers and carbon footprint auditing for sustainable supply chain reporting.
          </p>
        </div>
      </div>

      <h2 className="text-3xl font-bold text-black uppercase tracking-tighter mt-20 mb-8 border-b border-black/5 pb-4">Our Commitment</h2>
      <div className="space-y-8">
        <FeatureRow 
          title="Industry-Leading Technical Support" 
          desc="Our specialized engineering and operations team is available 24/7 to resolve any system or logistical friction instantly."
          icon={<Info className="w-6 h-6" />}
        />
        <FeatureRow 
          title="Unified Digital Workflow" 
          desc="We have eliminated manual administrative overhead. From compliance vetting to settlement and automated invoicing, our workflow is 100% digital."
          icon={<FileText className="w-6 h-6" />}
        />
      </div>
    </div>
  );
}

function AccountSetupContent() {
  return (
    <div className="space-y-12">
      <div className="space-y-4 mb-12">
        <div className="text-[10px] font-black text-[#BFFF07] uppercase tracking-[0.4em] bg-black inline-block px-3 py-1 rounded-full">Onboarding Guide</div>
        <h1 className="text-5xl md:text-7xl font-medium text-black tracking-tighter uppercase leading-none">
          Account <br /> <span className="text-black/20 italic">Activation.</span>
        </h1>
      </div>

      <p className="text-xl text-black/60 leading-relaxed font-medium">
        The Alpha Freight onboarding process is designed to be seamless yet rigorous, ensuring only elite logistics professionals enter our ecosystem. Follow this professional roadmap to activate your enterprise profile.
      </p>
      
      <div className="space-y-12">
        {/* Step 1 */}
        <div className="p-10 rounded-[3rem] border border-black/5 bg-white shadow-xl space-y-8 group hover:border-[#BFFF07]/50 transition-all duration-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#BFFF07] flex items-center justify-center text-black font-black shadow-lg group-hover:scale-110 transition-transform">1</div>
              <h3 className="text-2xl font-black uppercase tracking-tight">Profile Initialization</h3>
            </div>
            <span className="text-[10px] font-black text-black/20 uppercase tracking-widest">Estimated: 2 Mins</span>
          </div>
          <p className="text-gray-500 font-medium leading-relaxed">
            Begin by selecting your primary role—<strong>Carrier</strong> or <strong>Supplier</strong>. This choice dictates your dashboard interface and the specific AI tools available to your account. Ensure your corporate email address is used for all primary communications.
          </p>
          <div className="relative aspect-video rounded-[2rem] overflow-hidden border border-black/5 group-hover:shadow-2xl transition-all duration-700">
            <Image src="/how-1.jpg" alt="Profile Initialization" fill className="object-cover transition-transform duration-1000 group-hover:scale-105" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
              <PlayCircle className="w-20 h-20 text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="p-10 rounded-[3rem] border border-black/5 bg-white shadow-xl space-y-8 group hover:border-black/20 transition-all duration-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-[#BFFF07] font-black shadow-lg group-hover:scale-110 transition-transform">2</div>
              <h3 className="text-2xl font-black uppercase tracking-tight">Corporate Credentialing</h3>
            </div>
            <span className="text-[10px] font-black text-black/20 uppercase tracking-widest">Required Stage</span>
          </div>
          <div className="bg-blue-50 border border-blue-100 p-8 rounded-3xl flex gap-6 items-start">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-black text-blue-900 uppercase tracking-widest">Verification Protocol</h4>
              <p className="text-sm text-blue-800/70 font-medium leading-relaxed">
                To maintain the integrity of our freight network, all corporate entities must undergo a verification check. This includes validation of your Company Registration Number and VAT credentials.
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { label: "Email Authentication", icon: Mail },
              { label: "Company Registration", icon: FileText },
              { label: "Bank Account Validation", icon: CreditCard },
              { label: "VAT Compliance Check", icon: Shield }
            ].map(step => (
              <div key={step.label} className="flex items-center gap-4 p-5 rounded-2xl bg-black/[0.02] border border-black/5 font-bold text-xs uppercase tracking-widest text-black/60 group-hover:bg-white group-hover:shadow-md transition-all">
                <step.icon className="w-4 h-4 text-[#BFFF07]" />
                {step.label}
              </div>
            ))}
          </div>
        </div>

        {/* Step 3 */}
        <div className="p-10 rounded-[3rem] border border-black/5 bg-black text-white shadow-2xl space-y-8 group transition-all duration-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#BFFF07] flex items-center justify-center text-black font-black shadow-lg group-hover:rotate-12 transition-transform">3</div>
              <h3 className="text-2xl font-black uppercase tracking-tight">Ecosystem Integration</h3>
            </div>
            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Final Step</span>
          </div>
          <p className="text-white/40 font-medium leading-relaxed">
            Once verified, you will be granted access to the <strong>Alpha Freight Command Center</strong>. Carriers should immediately download the mobile application to enable real-time GPS telemetry, while Shippers can begin configuring their API keys for deep system integration.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <button className="px-8 py-4 bg-[#BFFF07] text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:scale-105 transition-transform">Download Mobile App</button>
            <button className="px-8 py-4 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-white/10 transition-all">Explore API Docs</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function VettingContent() {
  return (
    <div className="space-y-12">
      <div className="space-y-4 mb-12">
        <div className="text-[10px] font-black text-[#BFFF07] uppercase tracking-[0.4em] bg-black inline-block px-3 py-1 rounded-full">Compliance Standards</div>
        <h1 className="text-5xl md:text-7xl font-medium text-black tracking-tighter uppercase leading-none">
          Carrier <br /> <span className="text-black/20 italic">Vetting.</span>
        </h1>
      </div>

      <p className="text-xl text-black/60 leading-relaxed font-medium mb-12">
        To maintain the UK's most reliable freight network, Alpha Freight enforces rigorous compliance protocols. Our 5-step vetting process ensures that every carrier on the platform operates with elite standards of safety, insurance, and legality.
      </p>
      
      <div className="space-y-16">
        {/* Insurance Requirements */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-[#BFFF07]">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight">Insurance Requirements</h3>
          </div>
          
          <div className="grid gap-6">
            <VettingCard 
              title="Goods in Transit (GIT)" 
              requirement="Min £50,000 Coverage"
              desc="Comprehensive coverage for the cargo being transported. Policies must be active and specifically cover 'Haulage for Hire and Reward'."
            />
            <VettingCard 
              title="Public Liability" 
              requirement="Min £2,000,000 Coverage"
              desc="Protection against third-party injury or property damage during operations. Standard industry requirement for all Alpha Freight partners."
            />
            <VettingCard 
              title="Operator's License" 
              requirement="UK Standard National/Int."
              desc="A valid O-License is mandatory for vehicles over 3.5 tonnes. We verify your license status directly with the DVSA database."
            />
          </div>
        </section>

        {/* Verification Protocol */}
        <section className="p-10 rounded-[3rem] bg-black text-white space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#BFFF07]/10 blur-[100px] -z-0" />
          
          <div className="relative z-10 space-y-6">
            <h3 className="text-3xl font-black uppercase tracking-tighter">The 5-Step Verification <span className="text-[#BFFF07]">Protocol</span></h3>
            <div className="grid gap-4">
              {[
                { step: "01", title: "Digital Document Submission", detail: "Upload all insurance and licensing through the secure portal." },
                { step: "02", title: "Automated Data Validation", detail: "Our AI checks document expiry and coverage limits instantly." },
                { step: "03", title: "Manual Compliance Audit", detail: "Alpha's risk team performs a secondary human review for accuracy." },
                { step: "04", title: "Native App Integration", detail: "Device binding to ensure secure GPS telemetry and data integrity." },
                { step: "05", title: "Network Activation", detail: "Full access granted to the premium load board and 7-day payouts." }
              ].map((item) => (
                <div key={item.step} className="flex gap-6 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
                  <span className="text-xl font-black text-[#BFFF07] opacity-40 group-hover:opacity-100 transition-opacity">{item.step}</span>
                  <div className="space-y-1">
                    <h4 className="font-bold uppercase tracking-tight text-sm">{item.title}</h4>
                    <p className="text-xs text-white/40 font-medium">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ongoing Compliance */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#BFFF07] flex items-center justify-center text-black">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight">Ongoing Monitoring</h3>
          </div>
          <p className="text-gray-500 font-medium leading-relaxed">
            Vetting is not a one-time event. Our system continuously monitors the status of your credentials. If an insurance policy expires or a license is revoked, the account is automatically suspended from the marketplace until compliance is restored, ensuring total risk mitigation for our shipping partners.
          </p>
        </section>
      </div>
    </div>
  );
}

function FindingLoadsContent() {
  return (
    <div className="space-y-12">
      <div className="space-y-4 mb-12">
        <div className="text-[10px] font-black text-[#BFFF07] uppercase tracking-[0.4em] bg-black inline-block px-3 py-1 rounded-full">Procurement Cycle</div>
        <h1 className="text-5xl md:text-7xl font-medium text-black tracking-tighter uppercase leading-none">
          Freight <br /> <span className="text-black/20 italic">Acquisition.</span>
        </h1>
      </div>

      <p className="text-xl text-black/60 leading-relaxed font-medium mb-12">
        Our intelligent marketplace is engineered to eliminate dead mileage and maximize fleet utilization. Using the Alpha Matching Engine, carriers can source high-fidelity freight opportunities that align perfectly with their operational capacity and preferred routes.
      </p>

      {/* AI Hero Visual */}
      <div className="relative aspect-[21/9] rounded-[3rem] overflow-hidden bg-black flex items-center justify-center group shadow-2xl">
        <div className="absolute inset-0 z-0 opacity-60">
          <NetworkCanvas3D />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-1" />
        <div className="relative z-10 flex flex-col items-center justify-center text-center p-12 space-y-6">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#BFFF07]/30 bg-[#BFFF07]/5 text-[#BFFF07] text-[10px] font-bold uppercase tracking-widest">
            <Zap className="w-3 h-3" /> Predictive Matching Active
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none">
            Precision <br /> Load Discovery
          </h2>
          <button className="px-10 py-4 bg-[#BFFF07] text-black font-black rounded-xl uppercase text-xs tracking-widest hover:scale-105 transition-transform shadow-[0_0_30px_rgba(191,255,7,0.3)]">
            Access Load Board
          </button>
        </div>
      </div>
      
      <div className="space-y-16 mt-20">
        {/* Marketplace Dynamics */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-[#BFFF07]">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight">Advanced Marketplace Filters</h3>
          </div>
          <p className="text-gray-500 font-medium leading-relaxed">
            The Alpha Marketplace provides granular control over your freight procurement. Our multi-dimensional filtering system allows you to isolate opportunities based on real-time operational constraints.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Vehicle Specs", detail: "Curtain/Box/Reefer" },
              { label: "Weight Class", detail: "Up to 44 Tonnes" },
              { label: "Distance", detail: "Regional & National" },
              { label: "Load Type", detail: "FTL / LTL Options" }
            ].map(f => (
              <div key={f.label} className="p-6 rounded-2xl bg-white border border-black/5 shadow-sm space-y-2 group hover:border-[#BFFF07] transition-colors">
                <div className="text-[10px] font-black text-black/20 uppercase tracking-widest">{f.label}</div>
                <div className="text-xs font-bold text-black uppercase tracking-tight">{f.detail}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Smart Bidding & Booking */}
        <section className="grid md:grid-cols-2 gap-12 items-start">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-[#BFFF07]">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight">Procurement Models</h3>
            </div>
            <div className="space-y-6">
              <div className="p-8 rounded-3xl bg-[#FAF9F6] border border-black/5 space-y-4">
                <h4 className="text-lg font-black uppercase tracking-tighter flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#BFFF07]" /> Instant Booking
                </h4>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                  Secure freight immediately at the listed price. Ideal for high-demand routes and urgent capacity fulfillment.
                </p>
              </div>
              <div className="p-8 rounded-3xl bg-black text-white space-y-4">
                <h4 className="text-lg font-black uppercase tracking-tighter flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#BFFF07]" /> Smart Bidding
                </h4>
                <p className="text-sm text-white/40 font-medium leading-relaxed">
                  Submit competitive offers based on your backhaul availability. Our system provides real-time feedback on bid strength.
                </p>
              </div>
            </div>
          </div>

          <div className="p-10 rounded-[3rem] bg-white border border-black/5 shadow-2xl space-y-8">
            <h3 className="text-2xl font-black uppercase tracking-tighter border-b border-black/5 pb-4">Live Telemetry Integration</h3>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">
              Once a load is secured, the Alpha Freight system automatically syncs route data to your driver's mobile terminal.
            </p>
            <div className="space-y-4">
              {[
                "Automated Route Calculation",
                "Instant Cargo Documentation",
                "Priority Support Assignment",
                "Electronic Consignment Notes"
              ].map(item => (
                <div key={item} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-black/60">
                  <ChevronRight className="w-4 h-4 text-[#BFFF07]" /> {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function SmartBiddingContent() {
  return (
    <div className="space-y-12">
      <div className="space-y-4 mb-12">
        <div className="text-[10px] font-black text-[#BFFF07] uppercase tracking-[0.4em] bg-black inline-block px-3 py-1 rounded-full">Revenue Optimization</div>
        <h1 className="text-5xl md:text-7xl font-medium text-black tracking-tighter uppercase leading-none">
          Dynamic <br /> <span className="text-black/20 italic">Negotiation.</span>
        </h1>
      </div>

      <p className="text-xl text-black/60 leading-relaxed font-medium mb-12">
        Alpha Freight’s Smart Bidding system transforms traditional freight negotiation into a data-driven auction. We empower carriers to leverage their backhaul capacity and route efficiency to secure high-margin loads through intelligent, real-time counter-offers.
      </p>

      <div className="grid md:grid-cols-2 gap-8 my-16">
        {/* Bid Strength Analysis */}
        <div className="p-10 rounded-[3rem] border border-black/5 bg-white shadow-xl space-y-6 group hover:border-[#BFFF07]/50 transition-all duration-500">
          <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center text-[#BFFF07]">
            <Cpu className="w-7 h-7" />
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tighter">AI Bid Strength Analysis</h3>
          <p className="text-gray-500 font-medium leading-relaxed">
            Our AI engine provides instantaneous feedback on your bid’s competitiveness. By analyzing current market trends and historical pricing on specific lanes, the system categorizes your offer as <strong>Strong</strong>, <strong>Fair</strong>, or <strong>Below Market</strong>.
          </p>
        </div>

        {/* Backhaul Optimization */}
        <div className="p-10 rounded-[3rem] border border-black/5 bg-black text-white shadow-2xl space-y-6 group transition-all duration-500">
          <div className="w-14 h-14 rounded-2xl bg-[#BFFF07] flex items-center justify-center text-black">
            <Zap className="w-7 h-7" />
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tighter text-[#BFFF07]">Backhaul Maximization</h3>
          <p className="text-white/40 font-medium leading-relaxed">
            Eliminate empty return trips. The bidding engine prioritizes carriers who can demonstrate route optimization, allowing you to secure loads that fill your return leg at highly competitive rates.
          </p>
        </div>
      </div>

      <h2 className="text-3xl font-bold text-black uppercase tracking-tighter mt-20 mb-8 border-b border-black/5 pb-4">Negotiation Protocol</h2>
      
      <div className="space-y-12">
        {/* Step-by-Step Bidding */}
        {[
          {
            step: "01",
            title: "Opportunity Assessment",
            desc: "Review load details including cargo weight, handling requirements, and strict delivery windows."
          },
          {
            step: "02",
            title: "Offer Submission",
            desc: "Enter your competitive bid based on your available capacity and current vehicle proximity."
          },
          {
            step: "03",
            title: "Real-time Feedback",
            desc: "Receive instant notifications if a shipper counters your bid or if a competitor submits a stronger offer."
          },
          {
            step: "04",
            title: "Contract Finalization",
            desc: "Once accepted, the digital contract is cryptographically signed and the load is assigned to your fleet."
          }
        ].map((item) => (
          <div key={item.step} className="flex gap-8 p-8 rounded-3xl bg-[#FAF9F6] border border-black/5 hover:bg-white hover:shadow-lg transition-all group">
            <span className="text-4xl font-black text-black/10 group-hover:text-[#BFFF07] transition-colors">{item.step}</span>
            <div className="space-y-2">
              <h4 className="text-xl font-black uppercase tracking-tight">{item.title}</h4>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Payout Security Integration */}
      <div className="mt-20 p-12 rounded-[3.5rem] bg-gradient-to-br from-blue-600 to-blue-800 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[100px] -z-0 translate-x-1/2 -translate-y-1/2" />
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-[#BFFF07]" />
            <h3 className="text-3xl font-black uppercase tracking-tighter">Settlement Integrity</h3>
          </div>
          <p className="text-white/70 text-lg max-w-2xl font-medium leading-relaxed">
            Every accepted bid is automatically backed by our <strong>Financial Integrity Protocol</strong>. This guarantees that once the Digital POD is verified, your funds are secured and scheduled for our industry-leading 7-day payout.
          </p>
        </div>
      </div>
    </div>
  );
}

function PODUploadContent() {
  return (
    <div className="space-y-12">
      <div className="space-y-4 mb-12">
        <div className="text-[10px] font-black text-[#BFFF07] uppercase tracking-[0.4em] bg-black inline-block px-3 py-1 rounded-full">Execution & Settlement</div>
        <h1 className="text-5xl md:text-7xl font-medium text-black tracking-tighter uppercase leading-none">
          Digital <br /> <span className="text-black/20 italic">Proof of Delivery.</span>
        </h1>
      </div>

      <p className="text-xl text-black/60 leading-relaxed font-medium mb-12">
        Alpha Freight’s Digital POD (Proof of Delivery) system is the architectural cornerstone of our frictionless settlement engine. By digitizing the terminal phase of the delivery lifecycle, we facilitate instantaneous data reconciliation, triggering the industry’s most accelerated payout protocols.
      </p>

      {/* Main Workflow Card */}
      <div className="p-12 rounded-[3.5rem] bg-[#FAF9F6] border border-black/5 space-y-12 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#BFFF07]/10 blur-[80px] -z-0" />
        
        <div className="relative z-10">
          <h3 className="text-3xl font-black uppercase tracking-tighter mb-8">The Mobile-First <span className="text-black/30">Workflow</span></h3>
          <div className="grid gap-10">
            {[
              {
                step: "01",
                title: "High-Fidelity In-App Capture",
                desc: "Utilizing the Alpha Freight Mobile Terminal, drivers capture high-resolution imagery of the physical delivery notes. Our edge-detection technology ensures perfect document alignment and legibility in any lighting condition."
              },
              {
                step: "02",
                title: "Geospatial & Temporal Validation",
                desc: "Every submission is automatically embedded with cryptographic GPS coordinates and UTC-synchronized timestamps, providing an immutable audit trail of the delivery event."
              },
              {
                step: "03",
                title: "Real-time Ecosystem Sync",
                desc: "The validated Digital POD is instantaneously propagated across the Alpha network, updating the Shipper’s control tower and moving the transaction from 'Active' to 'Delivered' in milliseconds."
              }
            ].map((item) => (
              <div key={item.step} className="flex gap-8 items-start group/step">
                <div className="w-12 h-12 rounded-2xl bg-black text-[#BFFF07] flex items-center justify-center shrink-0 font-black text-lg group-hover/step:scale-110 group-hover/step:rotate-3 transition-all duration-500 shadow-xl">
                  {item.step}
                </div>
                <div className="space-y-3">
                  <h4 className="text-2xl font-bold uppercase tracking-tight group-hover/step:text-black transition-colors">{item.title}</h4>
                  <p className="text-gray-500 text-base font-medium leading-relaxed max-w-2xl">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI & Integrity Grid */}
      <div className="grid md:grid-cols-2 gap-8 mt-12">
        <div className="p-10 rounded-[3rem] border border-black/5 bg-white shadow-xl space-y-6 group hover:border-[#BFFF07]/50 transition-all duration-500">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
            <Cpu className="w-7 h-7" />
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tighter">AI-Powered OCR Verification</h3>
          <p className="text-gray-500 font-medium leading-relaxed">
            Our proprietary Vision AI extracts and validates consignee names, signatures, and timestamps directly from the image. This eliminates manual data entry errors and accelerates the reconciliation process by over 400%.
          </p>
        </div>

        <div className="p-10 rounded-[3rem] border border-black/5 bg-black text-white shadow-2xl space-y-6 group hover:scale-[1.02] transition-all duration-500">
          <div className="w-14 h-14 rounded-2xl bg-[#BFFF07]/10 flex items-center justify-center text-[#BFFF07] group-hover:bg-[#BFFF07] group-hover:text-black transition-all duration-500">
            <Shield className="w-7 h-7" />
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tighter text-[#BFFF07]">Cryptographic Integrity</h3>
          <p className="text-white/40 font-medium leading-relaxed">
            Every Digital POD is hashed using SHA-256 encryption upon upload, creating a tamper-proof record that satisfies the most stringent regulatory and insurance compliance standards in the UK logistics sector.
          </p>
        </div>
      </div>

      {/* Status Notifications Section */}
      <section className="mt-20 space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#BFFF07] flex items-center justify-center text-black shadow-lg">
            <Mail className="w-5 h-5" />
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tight">Omnichannel Notifications</h3>
        </div>
        <p className="text-gray-500 font-medium leading-relaxed">
          Stay informed throughout the settlement lifecycle. Alpha Freight provides real-time alerts via Webhooks, Email, and Push Notifications at every critical milestone.
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: "POD Received", status: "Active" },
            { label: "AI Verified", status: "Processing" },
            { label: "Payout Scheduled", status: "Confirmed" }
          ].map((notif) => (
            <div key={notif.label} className="p-6 rounded-2xl bg-black/[0.02] border border-black/5 space-y-3">
              <div className="text-[10px] font-black text-black/20 uppercase tracking-widest">{notif.label}</div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#BFFF07] animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-tight">{notif.status}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Visual Support Section */}
      <div className="mt-20 space-y-8">
        <h3 className="text-2xl font-black uppercase tracking-tight border-b border-black/5 pb-4">Standard Submission Standards</h3>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            "Full Signature Visibility",
            "High-Resolution Clarity",
            "Zero Margin Cropping",
            "Balanced Ambient Lighting",
            "Temporal Synchronization",
            "Consignee Identification"
          ].map(req => (
            <div key={req} className="flex items-center gap-3 p-4 rounded-xl bg-black/[0.02] border border-black/5 font-bold text-[10px] uppercase tracking-widest text-black/60 hover:bg-[#BFFF07]/10 hover:border-[#BFFF07]/30 transition-all cursor-default group">
              <ChevronRight className="w-4 h-4 text-[#BFFF07] group-hover:translate-x-1 transition-transform" /> {req}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PostingFreightContent() {
  return (
    <div className="space-y-12">
      <div className="space-y-4 mb-12">
        <div className="text-[10px] font-black text-[#BFFF07] uppercase tracking-[0.4em] bg-black inline-block px-3 py-1 rounded-full">Supply Chain Initiation</div>
        <h1 className="text-5xl md:text-7xl font-medium text-black tracking-tighter uppercase leading-none">
          Freight <br /> <span className="text-black/20 italic">Dispatch.</span>
        </h1>
      </div>

      <p className="text-xl text-black/60 leading-relaxed font-medium mb-12">
        The Alpha Freight Supplier Portal is engineered for high-velocity logistics management. Our freight posting engine allows shippers to transition from manual load entries to automated, AI-driven dispatch cycles, ensuring your cargo is matched with elite carriers at optimal market rates.
      </p>

      {/* Hero Visual Card */}
      <div className="p-12 rounded-[3.5rem] bg-[#FAF9F6] border border-black/5 relative overflow-hidden group shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#BFFF07]/10 blur-[100px] -z-0" />
        <div className="relative z-10 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-[#BFFF07] shadow-lg">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="text-3xl font-black uppercase tracking-tighter">Intelligent Load <span className="text-black/30">Entry</span></h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-[2.5rem] bg-white border border-black/5 space-y-4 hover:shadow-xl transition-all duration-500 group/card">
              <h4 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#BFFF07]" /> Manual Entry
              </h4>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                A streamlined, single-page interface for posting individual loads. Perfect for urgent shipments or low-volume operational days.
              </p>
            </div>
            <div className="p-8 rounded-[2.5rem] bg-black text-white space-y-4 hover:scale-[1.02] transition-all duration-500">
              <h4 className="text-lg font-black uppercase tracking-tight flex items-center gap-2 text-[#BFFF07]">
                <Layers className="w-4 h-4" /> Bulk Protocol
              </h4>
              <p className="text-white/40 text-sm font-medium leading-relaxed">
                Upload hundreds of loads simultaneously via CSV or Excel. Our engine auto-maps your data fields to the Alpha network in seconds.
              </p>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-3xl font-bold text-black uppercase tracking-tighter mt-20 mb-8 border-b border-black/5 pb-4">Dispatch Workflow</h2>

      <div className="space-y-8">
        {[
          {
            step: "01",
            title: "Freight Specification",
            desc: "Define your cargo parameters—weight, dimensions, temperature requirements, and specialized handling instructions (e.g., ADR, Tail Lift).",
            tags: ["High Resolution", "Field Mapping"]
          },
          {
            step: "02",
            title: "Dynamic Market Pricing",
            desc: "Our AI analyzes real-time lane data, fuel indices, and carrier density to suggest a 'Smart Price' that guarantees rapid acceptance while maintaining cost efficiency.",
            tags: ["AI Suggested", "Real-time Data"]
          },
          {
            step: "03",
            title: "Automated Allocation",
            desc: "Once posted, your load is instantaneously broadcasted to the most qualified carriers in our network based on their proximity and performance rating.",
            tags: ["Match Engine", "Zero Latency"]
          }
        ].map((item) => (
          <div key={item.step} className="flex flex-col md:flex-row gap-8 p-10 rounded-[3rem] bg-white border border-black/5 hover:border-[#BFFF07]/50 transition-all group">
            <div className="w-16 h-16 rounded-3xl bg-black text-[#BFFF07] flex items-center justify-center shrink-0 font-black text-2xl shadow-2xl group-hover:rotate-6 transition-transform">
              {item.step}
            </div>
            <div className="space-y-4 flex-1">
              <div className="flex flex-wrap gap-2">
                {item.tags.map(tag => (
                  <span key={tag} className="text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-full bg-black/[0.03] text-black/40 border border-black/5">{tag}</span>
                ))}
              </div>
              <h4 className="text-2xl font-black uppercase tracking-tight">{item.title}</h4>
              <p className="text-gray-500 text-base font-medium leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* API Integration Section */}
      <div className="mt-20 p-12 rounded-[3.5rem] bg-gradient-to-br from-zinc-900 to-black text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full bg-[url('/grid.svg')] opacity-10" />
        <div className="relative z-10 space-y-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#BFFF07] flex items-center justify-center text-black">
              <Code className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight text-[#BFFF07]">Enterprise API Sync</h3>
          </div>
          <p className="text-white/60 text-lg max-w-2xl font-medium leading-relaxed">
            For high-volume shippers, Alpha Freight offers a robust RESTful API that integrates directly with your existing TMS or ERP system. Automate your entire dispatch workflow without ever leaving your internal dashboard.
          </p>
          <div className="flex gap-4">
            <button className="px-8 py-4 bg-[#BFFF07] text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:scale-105 transition-transform shadow-[0_0_30px_rgba(191,255,7,0.3)]">View API Reference</button>
            <button className="px-8 py-4 bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-white/10 transition-all">Request Webhook Access</button>
          </div>
        </div>
      </div>

      {/* Quality Standards */}
      <div className="mt-20 space-y-8">
        <h3 className="text-2xl font-black uppercase tracking-tight border-b border-black/5 pb-4">Supplier Posting Standards</h3>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            "Accurate Weight Specs",
            "Clear Loading Windows",
            "Detailed Cargo Type",
            "Verified Site Access"
          ].map(req => (
            <div key={req} className="flex items-center gap-3 p-6 rounded-2xl bg-black/[0.02] border border-black/5 font-bold text-[10px] uppercase tracking-widest text-black/60 hover:text-black transition-colors cursor-default">
              <ChevronRight className="w-4 h-4 text-[#BFFF07]" /> {req}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

 function TrackingContent() {
  return (
    <div className="space-y-12">
      <div className="space-y-4 mb-12">
        <div className="text-[10px] font-black text-[#BFFF07] uppercase tracking-[0.4em] bg-black inline-block px-3 py-1 rounded-full">Operational Visibility</div>
        <h1 className="text-5xl md:text-7xl font-medium text-black tracking-tighter uppercase leading-none">
          Live <br /> <span className="text-black/20 italic">Control Tower.</span>
        </h1>
      </div>

      <p className="text-xl text-black/60 leading-relaxed font-medium mb-12">
        Alpha Freight provides shippers with a high-fidelity control tower, offering granular visibility into every shipment across the UK. Our real-time tracking engine harmonizes GPS telemetry with predictive AI to eliminate supply chain blind spots.
      </p>

      {/* Hero Tracking Visual */}
      <div className="relative aspect-[21/9] rounded-[3.5rem] overflow-hidden bg-black flex items-center justify-center group shadow-2xl mb-16 border border-white/5">
        <div className="absolute inset-0 z-0 opacity-40 group-hover:opacity-60 transition-opacity duration-1000">
          <NetworkCanvas3D />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-1" />
        <div className="relative z-10 text-center space-y-6 p-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#BFFF07]/30 bg-[#BFFF07]/5 text-[#BFFF07] text-[10px] font-black uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-[#BFFF07] animate-ping" /> Global Telemetry Active
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter">
            Total Supply Chain <br /> <span className="text-[#BFFF07]">Transparency</span>
          </h2>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* GPS Telemetry Card */}
        <div className="p-10 rounded-[3rem] border border-black/5 bg-white shadow-xl space-y-6 group hover:border-[#BFFF07]/50 transition-all duration-500">
          <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center text-[#BFFF07] shadow-lg group-hover:scale-110 transition-transform">
            <Globe className="w-7 h-7" />
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tighter">Real-Time GPS Telemetry</h3>
          <p className="text-gray-500 font-medium leading-relaxed">
            Monitor vehicle positions with sub-meter accuracy. Our system aggregates data from driver mobile terminals and native vehicle telematics to provide a unified, live map view of your entire freight operation.
          </p>
        </div>

        {/* Predictive ETA Card */}
        <div className="p-10 rounded-[3rem] border border-black/5 bg-black text-white shadow-2xl space-y-6 group hover:scale-[1.02] transition-all duration-500">
          <div className="w-14 h-14 rounded-2xl bg-[#BFFF07] flex items-center justify-center text-black shadow-lg group-hover:rotate-12 transition-transform">
            <Zap className="w-7 h-7" />
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tighter text-[#BFFF07]">Predictive AI ETA</h3>
          <p className="text-white/40 font-medium leading-relaxed">
            Our neural network analyzes live traffic density, weather conditions, and historical route latency to generate hyper-accurate ETAs, allowing your warehouse teams to optimize loading schedules dynamically.
          </p>
        </div>
      </div>

      <h2 className="text-3xl font-bold text-black uppercase tracking-tighter mt-20 mb-8 border-b border-black/5 pb-4">Tracking Capabilities</h2>

      <div className="space-y-6">
        {[
          {
            title: "Omnichannel Milestone Alerts",
            desc: "Receive instantaneous notifications via Email, SMS, or Webhooks for critical events: Loading Started, In Transit, Near Destination, and Delivery Confirmed.",
            icon: Mail
          },
          {
            title: "Dynamic Incident Management",
            desc: "Automated detection of route deviations or unexpected delays. Our system proactively flags potential issues, allowing for immediate logistical intervention.",
            icon: Shield
          },
          {
            title: "Shareable Tracking Links",
            desc: "Empower your end-customers by providing white-labeled, secure tracking links. Enhance the customer experience with professional-grade visibility.",
            icon: ExternalLink
          }
        ].map((item) => (
          <div key={item.title} className="flex gap-8 p-8 rounded-3xl bg-[#FAF9F6] border border-black/5 hover:bg-white hover:shadow-lg transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-black text-[#BFFF07] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-lg">
              <item.icon className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-black uppercase tracking-tight">{item.title}</h4>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Integration Banner */}
      <div className="mt-20 p-12 rounded-[3.5rem] bg-gradient-to-br from-blue-600 to-blue-900 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-full h-full bg-[url('/grid.svg')] opacity-10" />
        <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1 space-y-6">
            <h3 className="text-3xl font-black uppercase tracking-tighter">Ecosystem <span className="text-[#BFFF07]">Integration</span></h3>
            <p className="text-white/70 text-lg font-medium leading-relaxed">
              Tracking data isn't just for viewing—it's for action. Use our Webhooks to trigger internal workflows, update your ERP, or notify your CRM systems automatically.
            </p>
            <button className="px-10 py-4 bg-[#BFFF07] text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:scale-105 transition-transform">Configure Webhooks</button>
          </div>
          <div className="hidden md:block w-px h-48 bg-white/10" />
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-[#BFFF07] font-black text-xs">99%</div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Data Accuracy</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-[#BFFF07] font-black text-xs">5S</div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Refresh Rate</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsContent() {
  return (
    <div className="space-y-12">
      <div className="space-y-4 mb-12">
        <div className="text-[10px] font-black text-[#BFFF07] uppercase tracking-[0.4em] bg-black inline-block px-3 py-1 rounded-full">Intelligence & Insights</div>
        <h1 className="text-5xl md:text-7xl font-medium text-black tracking-tighter uppercase leading-none">
          Performance <br /> <span className="text-black/20 italic">Data.</span>
        </h1>
      </div>

      <p className="text-xl text-black/60 leading-relaxed font-medium mb-12">
        Alpha Freight’s analytics engine transforms raw logistical telemetry into actionable intelligence. Our enterprise-grade dashboard utilizes high-performance bento grids to surface critical KPIs, enabling data-driven decisions that optimize your supply chain efficiency.
      </p>

      {/* Bento Grid Analytics */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Main KPI */}
        <div className="md:col-span-2 p-10 rounded-[3rem] bg-black text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#BFFF07]/10 blur-[100px] -z-0" />
          <div className="relative z-10 space-y-8">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h4 className="text-sm font-black uppercase tracking-widest text-white/40">Network Performance</h4>
                <div className="text-5xl font-black text-[#BFFF07] tracking-tighter">98.4%</div>
              </div>
              <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-[#BFFF07]">
                +2.1% WoW
              </div>
            </div>
            <div className="h-32 flex items-end gap-2">
              {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                <motion.div 
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: i * 0.1, duration: 1 }}
                  className="flex-1 bg-gradient-to-t from-[#BFFF07] to-[#BFFF07]/40 rounded-t-lg"
                />
              ))}
            </div>
            <p className="text-sm text-white/40 font-medium leading-relaxed max-w-md">
              Aggregate on-time delivery (OTD) metrics across all national lanes. Our AI models predict future OTD trends based on current carrier performance.
            </p>
          </div>
        </div>

        {/* Carrier Scorecard */}
        <div className="p-10 rounded-[3rem] bg-[#FAF9F6] border border-black/5 space-y-8 group hover:border-black/20 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-black text-[#BFFF07] flex items-center justify-center shadow-lg">
            <Shield className="w-6 h-6" />
          </div>
          <div className="space-y-4">
            <h4 className="text-xl font-black uppercase tracking-tight">Carrier Scorecards</h4>
            <div className="space-y-3">
              {[
                { label: "Elite Carriers", val: "84%" },
                { label: "Standard", val: "12%" },
                { label: "Under Review", val: "4%" }
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center border-b border-black/5 pb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-black/40">{item.label}</span>
                  <span className="text-xs font-bold">{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lane Analysis */}
        <div className="p-10 rounded-[3rem] bg-white border border-black/5 shadow-xl space-y-6 group hover:border-[#BFFF07]/50 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-[#BFFF07]/10 flex items-center justify-center text-black">
            <Globe className="w-6 h-6" />
          </div>
          <h4 className="text-xl font-black uppercase tracking-tight">Lane Optimization</h4>
          <p className="text-gray-500 text-xs font-medium leading-relaxed">
            Identify the most cost-effective routes using historical data. Our engine suggests lane adjustments that can reduce spend by up to 15%.
          </p>
        </div>

        {/* Custom Reporting */}
        <div className="md:col-span-2 p-10 rounded-[3rem] bg-[#BFFF07] text-black space-y-8 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1 space-y-4">
              <h4 className="text-3xl font-black uppercase tracking-tighter leading-none">Custom Intelligence <br /> <span className="opacity-40">Reports</span></h4>
              <p className="text-sm font-bold uppercase tracking-wide opacity-60 leading-relaxed">
                Generate enterprise-ready PDF or CSV reports for internal stakeholders. Automate delivery to your inbox on a daily, weekly, or monthly cadence.
              </p>
            </div>
            <button className="px-10 py-4 bg-black text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:scale-105 transition-transform">Schedule Report</button>
          </div>
        </div>
      </div>
    </div>
  );
}

 function PayoutsContent() {
  return (
    <div className="space-y-12">
      <div className="space-y-4 mb-12">
        <div className="text-[10px] font-black text-[#BFFF07] uppercase tracking-[0.4em] bg-black inline-block px-3 py-1 rounded-full">Financial Liquidity</div>
        <h1 className="text-5xl md:text-7xl font-medium text-black tracking-tighter uppercase leading-none">
          7-Day <br /> <span className="text-black/20 italic">Payouts.</span>
        </h1>
      </div>

      <p className="text-xl text-black/60 leading-relaxed font-medium mb-12">
        Alpha Freight is redefining the financial standards of the logistics industry. Our 7-Day Payout Guarantee ensures that your capital remains liquid, allowing you to focus on fleet expansion and operational excellence rather than administrative debt collection.
      </p>

      {/* Payout Hero Card */}
      <div className="p-12 rounded-[3.5rem] bg-black text-white space-y-12 relative overflow-hidden shadow-2xl group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#BFFF07]/20 blur-[100px] -z-0" />
        
        <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1 space-y-6">
            <h3 className="text-4xl font-black uppercase tracking-tighter">The Alpha <span className="text-[#BFFF07]">Financial Edge</span></h3>
            <p className="text-white/40 text-lg font-medium leading-relaxed">
              Traditional freight brokerage often involves 30, 60, or even 90-day payment terms. We’ve collapsed this timeline to just 7 days post-POD verification, providing the most competitive cash flow in the UK market.
            </p>
            <div className="flex gap-4">
              <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-[#BFFF07] font-black text-xs uppercase tracking-widest">
                No Factoring Fees
              </div>
              <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-[#BFFF07] font-black text-xs uppercase tracking-widest">
                Automated Invoicing
              </div>
            </div>
          </div>
          <div className="w-full md:w-64 aspect-square bg-[#BFFF07] rounded-[2.5rem] flex flex-col items-center justify-center text-black p-8 text-center group-hover:rotate-2 transition-transform duration-700">
            <div className="text-6xl font-black mb-2">7</div>
            <div className="text-sm font-black uppercase tracking-[0.2em] leading-none">Day <br /> Settlement</div>
          </div>
        </div>
      </div>

      <h2 className="text-3xl font-bold text-black uppercase tracking-tighter mt-20 mb-8 border-b border-black/5 pb-4">Settlement Workflow</h2>
      
      <div className="grid md:grid-cols-3 gap-6">
        {[
          {
            title: "Verification",
            desc: "AI-driven validation of the Digital POD and delivery compliance.",
            icon: Shield
          },
          {
            title: "Generation",
            desc: "Automated invoice creation aligned with the agreed contract rate.",
            icon: FileText
          },
          {
            title: "Disbursement",
            desc: "Electronic funds transfer initiated directly to your registered account.",
            icon: CreditCard
          }
        ].map((item, idx) => (
          <div key={item.title} className="p-8 rounded-[2.5rem] bg-[#FAF9F6] border border-black/5 space-y-6 group hover:bg-white hover:shadow-xl transition-all">
            <div className="w-12 h-12 rounded-2xl bg-black text-[#BFFF07] flex items-center justify-center group-hover:scale-110 transition-transform">
              <item.icon className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-black uppercase tracking-tight">{item.title}</h4>
              <p className="text-gray-500 text-xs font-medium leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Compliance & Security */}
      <div className="mt-20 p-10 rounded-[3rem] border border-black/5 bg-white space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#BFFF07]/10 flex items-center justify-center text-black">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tight">Security & Transparency</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-4">
            <h4 className="text-sm font-black uppercase tracking-widest text-black/30">Direct Bank Integration</h4>
            <p className="text-gray-500 font-medium leading-relaxed">
              We utilize secure Open Banking protocols to ensure that payments are routed directly to your corporate account with zero intermediaries. Every transaction is tracked and verifiable via your Alpha Dashboard.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-sm font-black uppercase tracking-widest text-black/30">Dispute Resolution</h4>
            <p className="text-gray-500 font-medium leading-relaxed">
              In the rare event of a settlement discrepancy, our dedicated finance team is available to resolve issues within 24 hours, ensuring your payout schedule remains uninterrupted.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function APIAuthContent() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
        <div className="text-[10px] font-black text-[#BFFF07] uppercase tracking-[0.4em] bg-black inline-block px-3 py-1 rounded-full">Developer Hub</div>
        <h1 className="text-5xl md:text-7xl font-medium text-black tracking-tighter uppercase leading-none">
          Authentication.
        </h1>
        <p className="text-xl text-black/60 leading-relaxed font-medium max-w-3xl">
          Alpha Freight uses OAuth 2.0 client credentials for server-to-server API access. Authenticate once, receive a short-lived Bearer token, and call marketplace endpoints from your backend with enterprise-grade security.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Protocol", value: "OAuth 2.0" },
          { label: "Token lifetime", value: "1 hour" },
          { label: "Transport", value: "TLS 1.3 only" },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-black/5 bg-[#FAF9F6] px-5 py-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30">{item.label}</p>
            <p className="mt-1 text-lg font-bold text-black">{item.value}</p>
          </div>
        ))}
      </div>

      <DocSection id="authentication" title="Authentication">
        <p className="text-gray-500 font-medium leading-relaxed">
          Register your integration in the Alpha Developer Console to receive a <code className="rounded bg-black/[0.04] px-1.5 py-0.5 text-sm font-mono">client_id</code> and <code className="rounded bg-black/[0.04] px-1.5 py-0.5 text-sm font-mono">client_secret</code>. Credentials are scoped to your organization and can be rotated without downtime.
        </p>
        <DocsCodeBlock label="POST /v1/auth/token" code={`curl -X POST https://api.alphafreight.uk/v1/auth/token \\
  -H "Content-Type: application/json" \\
  -d '{
    "client_id": "ALPHA_CLIENT_ID",
    "client_secret": "ALPHA_CLIENT_SECRET",
    "grant_type": "client_credentials",
    "scope": "loads:read loads:write webhooks:manage"
  }'`} />
        <DocsCodeBlock label="Response" code={`{
  "access_token": "af_live_xxxxxxxx",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "loads:read loads:write webhooks:manage"
}`} />
      </DocSection>

      <DocSection id="oauth-2-0-flow" title="OAuth 2.0 Flow">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { step: "01", title: "Request token", desc: "POST credentials to the auth server from your backend." },
            { step: "02", title: "Receive Bearer", desc: "Store access_token securely in memory or vault." },
            { step: "03", title: "Call API", desc: "Attach Authorization: Bearer on every request." },
            { step: "04", title: "Refresh", desc: "Request a new token before expiry — no refresh token required." },
          ].map((item) => (
            <div key={item.step} className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
              <span className="text-[10px] font-black text-[#BFFF07] bg-black px-2 py-1 rounded-full">{item.step}</span>
              <h4 className="mt-4 text-sm font-black uppercase tracking-tight">{item.title}</h4>
              <p className="mt-2 text-sm text-gray-500 font-medium leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
        <DocsCodeBlock label="Authenticated request" code={`curl https://api.alphafreight.uk/v1/loads \\
  -H "Authorization: Bearer af_live_xxxxxxxx" \\
  -H "Accept: application/json"`} />
      </DocSection>

      <DocSection id="environments" title="Environments">
        <div className="overflow-hidden rounded-[2rem] border border-black/5">
          <table className="w-full text-left text-sm">
            <thead className="bg-black text-white">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Environment</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Base URL</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Use case</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 bg-white">
              <tr>
                <td className="px-6 py-4 font-bold">Sandbox</td>
                <td className="px-6 py-4 font-mono text-xs text-black/60">https://sandbox-api.alphafreight.uk</td>
                <td className="px-6 py-4 text-gray-500">Integration testing, webhook simulation</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-bold">Production</td>
                <td className="px-6 py-4 font-mono text-xs text-black/60">https://api.alphafreight.uk</td>
                <td className="px-6 py-4 text-gray-500">Live loads, payouts, and carrier data</td>
              </tr>
            </tbody>
          </table>
        </div>
      </DocSection>

      <DocSection id="token-management" title="Token Management">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-8 rounded-[2.5rem] border border-black/5 bg-white shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-[#BFFF07]">
              <Key className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-black uppercase tracking-tight">Scopes</h4>
            <ul className="space-y-2 text-sm text-gray-500 font-medium">
              <li><code className="font-mono text-xs">loads:read</code> — List and retrieve load data</li>
              <li><code className="font-mono text-xs">loads:write</code> — Create and update postings</li>
              <li><code className="font-mono text-xs">carriers:read</code> — Carrier profiles and vetting status</li>
              <li><code className="font-mono text-xs">webhooks:manage</code> — Register webhook endpoints</li>
              <li><code className="font-mono text-xs">payouts:read</code> — Settlement and wallet events</li>
            </ul>
          </div>
          <div className="p-8 rounded-[2.5rem] bg-black text-white shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#BFFF07] flex items-center justify-center text-black">
              <Lock className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-black uppercase tracking-tight text-[#BFFF07]">Security rules</h4>
            <ul className="space-y-3 text-sm text-white/50 font-medium leading-relaxed">
              <li>Never expose client_secret in mobile apps or browser code.</li>
              <li>Rotate secrets from the Developer Console every 90 days.</li>
              <li>Use IP allowlisting for production credentials where possible.</li>
              <li>Log auth failures and alert on repeated 401 responses.</li>
            </ul>
          </div>
        </div>
      </DocSection>

      <DocSection id="rate-limits" title="Rate Limits">
        <p className="text-gray-500 font-medium leading-relaxed mb-6">
          Standard plans include 600 requests per minute per organization. Burst traffic above the limit returns <code className="font-mono text-xs bg-black/[0.04] px-1.5 py-0.5 rounded">429 Too Many Requests</code> with a <code className="font-mono text-xs">Retry-After</code> header.
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { tier: "Standard", limit: "600 / min" },
            { tier: "Enterprise", limit: "2,500 / min" },
            { tier: "Webhooks", limit: "Unlimited inbound" },
          ].map((item) => (
            <div key={item.tier} className="rounded-2xl border border-black/5 p-5 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-black/30">{item.tier}</p>
              <p className="mt-2 text-2xl font-black">{item.limit}</p>
            </div>
          ))}
        </div>
      </DocSection>
    </div>
  );
}

function WebhooksContent() {
  const eventGroups = [
    {
      category: "Load lifecycle",
      events: [
        { event: "load.created", desc: "A supplier finalizes a new freight posting on the marketplace." },
        { event: "load.updated", desc: "Load details, pricing, or pickup window are modified." },
        { event: "load.assigned", desc: "A carrier is matched and assigned to the load." },
        { event: "load.cancelled", desc: "The load is withdrawn before or after assignment." },
      ],
    },
    {
      category: "Delivery & POD",
      events: [
        { event: "delivery.started", desc: "The driver marks the load in transit from the mobile app." },
        { event: "delivery.location", desc: "GPS telemetry update (optional, high-frequency plans only)." },
        { event: "delivery.completed", desc: "Digital POD is uploaded and verified by the platform." },
      ],
    },
    {
      category: "Payments",
      events: [
        { event: "payout.initiated", desc: "Settlement is queued after successful POD verification." },
        { event: "payout.completed", desc: "Funds are released to the carrier wallet or bank account." },
        { event: "invoice.generated", desc: "Supplier invoice is created for the completed load." },
      ],
    },
  ];

  return (
    <div className="space-y-16">
      <div className="space-y-4">
        <div className="text-[10px] font-black text-[#BFFF07] uppercase tracking-[0.4em] bg-black inline-block px-3 py-1 rounded-full">Developer Hub</div>
        <h1 className="text-5xl md:text-7xl font-medium text-black tracking-tighter uppercase leading-none">
          Webhooks.
        </h1>
        <p className="text-xl text-black/60 leading-relaxed font-medium max-w-3xl">
          Stay synchronized with real-time events across the Alpha network. Register HTTPS endpoints to receive signed POST payloads when loads, deliveries, and payouts change — no polling required.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {["Real-time POST delivery", "HMAC-SHA256 signatures", "Automatic retries", "Sandbox simulator"].map((tag) => (
          <span key={tag} className="rounded-full border border-black/5 bg-[#FAF9F6] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-black/50">
            {tag}
          </span>
        ))}
      </div>

      <DocSection id="event-types" title="Event Types">
        <div className="space-y-10">
          {eventGroups.map((group) => (
            <div key={group.category} className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-black/30">{group.category}</h3>
              <div className="space-y-3">
                {group.events.map((item) => (
                  <div key={item.event} className="flex flex-col md:flex-row gap-4 md:items-center p-6 rounded-[2rem] bg-[#FAF9F6] border border-black/5 hover:bg-white hover:shadow-lg transition-all group">
                    <div className="px-5 py-2.5 rounded-xl bg-black text-[#BFFF07] font-mono text-xs font-black shrink-0 self-start group-hover:scale-105 transition-transform">
                      {item.event}
                    </div>
                    <p className="text-gray-500 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection id="payload-schema" title="Payload Schema">
        <p className="text-gray-500 font-medium leading-relaxed">
          Every webhook delivers a JSON envelope with a unique event ID, type, ISO 8601 timestamp, and a <code className="font-mono text-xs bg-black/[0.04] px-1.5 py-0.5 rounded">data</code> object containing the resource snapshot.
        </p>
        <DocsCodeBlock label="delivery.completed payload" code={`{
  "id": "evt_9l2k83j4m5n6",
  "type": "delivery.completed",
  "api_version": "2026-06-01",
  "created_at": "2026-06-06T14:30:00Z",
  "livemode": true,
  "data": {
    "load_id": "load_alpha_001",
    "reference": "PO-88421",
    "status": "delivered",
    "carrier_id": "car_7f3a91",
    "pod_url": "https://cdn.alphafreight.uk/pods/abc123.pdf",
    "completed_at": "2026-06-06T14:28:41Z"
  }
}`} />
        <div className="overflow-hidden rounded-[2rem] border border-black/5 mt-6">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#FAF9F6]">
              <tr>
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-black/40">Field</th>
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-black/40">Type</th>
                <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-black/40">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 bg-white">
              {[
                ["id", "string", "Unique event identifier for idempotency"],
                ["type", "string", "Dot-notation event name"],
                ["api_version", "string", "Schema version pinned at endpoint registration"],
                ["data", "object", "Resource payload at time of event"],
              ].map(([field, type, desc]) => (
                <tr key={field}>
                  <td className="px-6 py-3 font-mono text-xs font-bold">{field}</td>
                  <td className="px-6 py-3 text-gray-400">{type}</td>
                  <td className="px-6 py-3 text-gray-500">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocSection>

      <DocSection id="security-protocol" title="Security Protocol">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-8 rounded-[2.5rem] border border-black/5 bg-white space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-[#BFFF07]">
              <Shield className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-black uppercase tracking-tight">Signature verification</h4>
            <p className="text-gray-500 font-medium leading-relaxed text-sm">
              Each request includes <code className="font-mono text-xs">Alpha-Signature</code> and <code className="font-mono text-xs">Alpha-Timestamp</code> headers. Verify HMAC-SHA256 using your webhook signing secret and reject events older than 5 minutes.
            </p>
          </div>
          <div className="p-8 rounded-[2.5rem] bg-black text-white space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#BFFF07] flex items-center justify-center text-black">
              <Webhook className="w-6 h-6" />
            </div>
            <h4 className="text-xl font-black uppercase tracking-tight text-[#BFFF07]">Endpoint requirements</h4>
            <ul className="space-y-2 text-sm text-white/50 font-medium">
              <li>HTTPS with valid TLS certificate</li>
              <li>Respond with 2xx within 10 seconds</li>
              <li>Return 200 before heavy processing (queue async work)</li>
              <li>Handle duplicate events using event id</li>
            </ul>
          </div>
        </div>
        <DocsCodeBlock label="Verify signature (Node.js)" code={`import crypto from "crypto";

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload, "utf8")
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}`} />
      </DocSection>

      <DocSection id="retry-policy" title="Retry Policy">
        <p className="text-gray-500 font-medium leading-relaxed mb-6">
          Failed deliveries (non-2xx or timeout) are retried with exponential backoff for up to 72 hours. View delivery logs and replay events from the Developer Console.
        </p>
        <div className="flex flex-wrap gap-3">
          {["Immediate", "+5 min", "+30 min", "+2 hr", "+6 hr", "+24 hr"].map((delay, index) => (
            <div key={delay} className="flex items-center gap-2">
              <span className="rounded-xl bg-black text-[#BFFF07] px-4 py-2 text-xs font-black">{delay}</span>
              {index < 5 && <ChevronRight className="w-4 h-4 text-black/20" />}
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection id="testing-tools" title="Testing Tools">
        <div className="p-10 rounded-[3rem] bg-[#BFFF07] text-black space-y-6">
          <div className="flex items-center gap-4">
            <Terminal className="w-8 h-8" />
            <h4 className="text-2xl font-black uppercase tracking-tight">Webhook simulator</h4>
          </div>
          <p className="font-medium leading-relaxed max-w-2xl">
            Use the sandbox dashboard to fire test events against your local endpoint via ngrok or Cloudflare Tunnel. No live loads are affected.
          </p>
          <DocsCodeBlock label="Register endpoint" dark={false} code={`curl -X POST https://sandbox-api.alphafreight.uk/v1/webhooks \\
  -H "Authorization: Bearer af_test_xxxxxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://your-app.ngrok.io/webhooks/alpha",
    "events": ["load.created", "delivery.completed"],
    "description": "Staging integration"
  }'`} />
        </div>
      </DocSection>
    </div>
  );
}

function SDKsContent() {
  const sdks = [
    {
      lang: "Node.js",
      version: "v2.4.1",
      install: "npm install @alpha-freight/sdk",
      icon: "🟢",
      features: ["Full TypeScript types", "Auto token refresh", "Webhook helpers", "Retry middleware"],
      code: `import { AlphaFreight } from "@alpha-freight/sdk";

const client = new AlphaFreight({
  clientId: process.env.ALPHA_CLIENT_ID,
  clientSecret: process.env.ALPHA_CLIENT_SECRET,
  environment: "production",
});

const loads = await client.loads.list({ status: "open" });`,
    },
    {
      lang: "Python",
      version: "v1.8.0",
      install: "pip install alpha-freight",
      icon: "🔵",
      features: ["Pydantic models", "Async support", "Django/FastAPI examples", "CLI tools"],
      code: `from alpha_freight import AlphaFreight

client = AlphaFreight(
    client_id=os.environ["ALPHA_CLIENT_ID"],
    client_secret=os.environ["ALPHA_CLIENT_SECRET"],
)

loads = client.loads.list(status="open")`,
    },
    {
      lang: "Go",
      version: "v1.2.3",
      install: "go get github.com/alpha-freight/sdk-go",
      icon: "🔘",
      features: ["Context-aware", "Structured errors", "Concurrent-safe", "Minimal deps"],
      code: `import "github.com/alpha-freight/sdk-go/alpha"

client := alpha.NewClient(
    os.Getenv("ALPHA_CLIENT_ID"),
    os.Getenv("ALPHA_CLIENT_SECRET"),
)

loads, err := client.Loads.List(ctx, &alpha.ListLoadsParams{
    Status: "open",
})`,
    },
  ];

  return (
    <div className="space-y-16">
      <div className="space-y-4">
        <div className="text-[10px] font-black text-[#BFFF07] uppercase tracking-[0.4em] bg-black inline-block px-3 py-1 rounded-full">Developer Hub</div>
        <h1 className="text-5xl md:text-7xl font-medium text-black tracking-tighter uppercase leading-none">
          SDKs & <span className="text-black/20 italic">Libraries.</span>
        </h1>
        <p className="text-xl text-black/60 leading-relaxed font-medium max-w-3xl">
          Official SDKs with typed models, automatic authentication, and built-in retry logic. Ship your Alpha Freight integration in hours, not weeks.
        </p>
      </div>

      <DocSection id="quick-start" title="Quick Start">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { step: "1", title: "Install SDK", desc: "Add the package for your language." },
            { step: "2", title: "Configure credentials", desc: "Set client ID and secret as env vars." },
            { step: "3", title: "Make first call", desc: "List loads or register a webhook." },
          ].map((item) => (
            <div key={item.step} className="rounded-[2rem] border border-black/5 p-6 bg-white shadow-sm">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black text-[#BFFF07] text-sm font-black">{item.step}</span>
              <h4 className="mt-4 font-black uppercase tracking-tight">{item.title}</h4>
              <p className="mt-2 text-sm text-gray-500 font-medium">{item.desc}</p>
            </div>
          ))}
        </div>
      </DocSection>

      {sdks.map((sdk) => {
        const sectionId =
          sdk.lang === "Node.js"
            ? "node-js-sdk"
            : sdk.lang === "Python"
              ? "python-library"
              : "go-package";

        return (
        <DocSection key={sdk.lang} id={sectionId} title={sdk.lang === "Python" ? "Python Library" : sdk.lang === "Go" ? "Go Package" : "Node.js SDK"}>
          <div className="rounded-[2.5rem] border border-black/5 bg-white overflow-hidden shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/5 px-8 py-6">
              <div className="flex items-center gap-4">
                <span className="text-3xl">{sdk.icon}</span>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter">{sdk.lang}</h3>
                  <span className="text-[10px] font-black uppercase tracking-widest text-black/30">{sdk.version} · Official</span>
                </div>
              </div>
              <div className="rounded-xl bg-black/[0.03] border border-black/5 px-4 py-2 font-mono text-xs text-black/60">
                {sdk.install}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-0">
              <div className="p-8 border-b md:border-b-0 md:border-r border-black/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-black/30 mb-4">Features</p>
                <ul className="space-y-2">
                  {sdk.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm font-medium text-gray-500">
                      <Check className="w-4 h-4 text-[#BFFF07] shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-0">
                <DocsCodeBlock label="Example" code={sdk.code} compact />
              </div>
            </div>
          </div>
        </DocSection>
        );
      })}

      <DocSection id="community-wrappers" title="Community Wrappers">
        <div className="p-10 rounded-[3rem] bg-black text-white relative overflow-hidden">
          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-4">
              <Code className="w-8 h-8 text-[#BFFF07]" />
              <h3 className="text-3xl font-black uppercase tracking-tighter">Community maintained</h3>
            </div>
            <p className="text-white/50 max-w-2xl font-medium leading-relaxed">
              Building in PHP, Ruby, or .NET? These community libraries are reviewed by Alpha Engineering for API compatibility and security patterns.
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { lang: "PHP", pkg: "alpha-freight/php-sdk" },
                { lang: "Ruby", pkg: "alpha_freight gem" },
                { lang: ".NET", pkg: "AlphaFreight.Net" },
              ].map((item) => (
                <div key={item.lang} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30">{item.lang}</p>
                  <p className="mt-2 font-mono text-sm text-[#BFFF07]">{item.pkg}</p>
                </div>
              ))}
            </div>
            <Link
              href="https://github.com/alphafreight"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#BFFF07] text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:scale-105 transition-transform"
            >
              Explore GitHub <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
          <Braces className="absolute -right-8 -bottom-8 w-48 h-48 text-white/[0.03]" />
        </div>
      </DocSection>
    </div>
  );
}

function DocSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 space-y-6">
      <h2 className="text-3xl font-bold text-black uppercase tracking-tighter border-b border-black/5 pb-4">{title}</h2>
      {children}
    </section>
  );
}

function DocsCodeBlock({
  label,
  code,
  dark = true,
  compact = false,
}: {
  label: string;
  code: string;
  dark?: boolean;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  if (!dark) {
    return (
      <div className={`rounded-2xl border border-black/10 bg-white/80 overflow-hidden ${compact ? "" : "shadow-lg"}`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/5">
          <span className="text-[10px] font-black uppercase tracking-widest text-black/40">{label}</span>
          <button type="button" onClick={handleCopy} className="p-2 rounded-lg hover:bg-black/5 transition-colors">
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-black/40" />}
          </button>
        </div>
        <pre className={`p-4 overflow-x-auto text-xs font-mono leading-relaxed text-black/70 ${compact ? "max-h-64" : ""}`}>
          <code>{code}</code>
        </pre>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-[2rem] ${compact ? "" : "shadow-2xl"}`}>
      <div className="flex items-center justify-between px-6 py-4 bg-zinc-900 border-b border-white/5">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/20" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
          <div className="w-3 h-3 rounded-full bg-green-500/20" />
        </div>
        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{label}</span>
        <button type="button" onClick={handleCopy} className="p-2 rounded-lg bg-white/5 hover:bg-[#BFFF07] hover:text-black transition-all">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 opacity-40" />}
        </button>
      </div>
      <pre className={`p-6 md:p-8 bg-zinc-900 text-sm font-mono leading-relaxed overflow-x-auto text-zinc-400 ${compact ? "max-h-72" : ""}`}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

// --- Helper Components ---

function FeatureRow({ title, desc, icon }: { title: string, desc: string, icon: any }) {
  return (
    <div className="flex gap-8 group">
      <div className="w-14 h-14 rounded-2xl bg-black/[0.03] border border-black/5 flex items-center justify-center text-black group-hover:bg-[#BFFF07] transition-all duration-500">
        {icon}
      </div>
      <div className="space-y-2">
        <h4 className="text-xl font-bold uppercase tracking-tight">{title}</h4>
        <p className="text-gray-500 text-sm leading-relaxed max-w-md font-medium">{desc}</p>
      </div>
    </div>
  );
}

function VettingCard({ title, requirement, desc }: { title: string, requirement: string, desc: string }) {
  return (
    <div className="p-8 rounded-[2rem] border border-black/5 bg-white hover:border-[#BFFF07]/50 transition-all group">
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-xl font-bold uppercase tracking-tighter">{title}</h4>
        <span className="px-3 py-1 rounded-full bg-black text-[#BFFF07] text-[10px] font-black tracking-widest uppercase">{requirement}</span>
      </div>
      <p className="text-gray-400 text-sm font-medium leading-relaxed">{desc}</p>
    </div>
  );
}
