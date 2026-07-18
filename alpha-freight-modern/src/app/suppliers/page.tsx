"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  MapPin, 
  Truck, 
  Star, 
  ShieldCheck, 
  Phone, 
  Mail, 
  ChevronRight, 
  Filter,
  X,
  ArrowRight,
  Factory,
  Hammer,
  Layers,
  Settings,
  Building2
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import type { PublicSupplierListing } from "@/lib/public-directory";

const FALLBACK_IMAGE = "/alpha freight truck.jpg";

export default function SupplierDirectoryPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<PublicSupplierListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    async function fetchSuppliers() {
      setLoading(true);
      setFetchError(null);

      try {
        const response = await fetch("/api/public/suppliers");
        const payload = (await response.json()) as { suppliers?: PublicSupplierListing[]; error?: string };

        if (!response.ok) {
          throw new Error(payload.error || "Unable to load verified suppliers.");
        }

        setSuppliers(payload.suppliers ?? []);
      } catch (error) {
        setFetchError(error instanceof Error ? error.message : "Unable to load verified suppliers.");
        setSuppliers([]);
      } finally {
        setLoading(false);
      }
    }

    fetchSuppliers();
  }, []);

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         supplier.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || supplier.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = ["All", ...Array.from(new Set(suppliers.map((supplier) => supplier.category)))];

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans">
      <Navbar variant="dark" />
      
      {/* Hero Section */}
      <section className="pt-48 pb-20 px-6 bg-white relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-400/5 blur-[120px] rounded-full -mr-64 -mt-64" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-600/5 blur-[100px] rounded-full -ml-32 -mb-32" />

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-full mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Verified Supplier Network</span>
            </motion.div>
            
            <h1 className="text-6xl md:text-7xl font-black tracking-tight text-slate-900 mb-6 leading-[0.95]">
              Source from top <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 italic font-serif font-light">industrial partners</span>
            </h1>
            
            <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-2xl mx-auto">
              Browse our curated gallery of certified suppliers. Connect with steel producers, manufacturing plants, and industrial experts.
            </p>
          </motion.div>

          {/* Integrated Search Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto relative mb-24"
          >
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
              <input 
                type="text"
                placeholder="Search by company, city or material..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-16 pr-32 py-6 bg-white border border-slate-100 rounded-[32px] text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-200 transition-all shadow-xl shadow-slate-200/20"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 px-8 py-3.5 bg-slate-900 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-blue-600 transition-all">
                Search
              </button>
            </div>
          </motion.div>

          {/* Section Header & Filters */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-slate-100 pb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-400/20">
                <Filter className="w-6 h-6 text-slate-900" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Gallery</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filteredSuppliers.length} Suppliers Available</p>
              </div>
            </div>
            
            {/* Horizontal Pills Filter */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                    selectedCategory === cat 
                      ? "bg-slate-900 border-slate-900 text-white shadow-lg" 
                      : "bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-900"
                  }`}
                >
                  {cat === "All" ? "All Categories" : cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Listing Section */}
      <main className="max-w-7xl mx-auto px-6 pt-12 pb-32">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="animate-pulse">
                <div className="aspect-[4/3] mb-6 rounded-3xl bg-slate-100" />
                <div className="h-6 w-2/3 rounded bg-slate-100 mb-3" />
                <div className="h-4 w-full rounded bg-slate-50 mb-2" />
                <div className="h-4 w-1/2 rounded bg-slate-50" />
              </div>
            ))}
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
          {filteredSuppliers.map((supplier, idx) => (
            <motion.div
              key={supplier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group cursor-pointer"
              onClick={() => router.push(`/suppliers/${supplier.id}`)}
            >
              {/* Card Image Wrapper */}
              <div className="relative aspect-[4/3] mb-6 overflow-hidden rounded-3xl bg-white border border-slate-100 group-hover:border-slate-200 transition-all flex items-center justify-center p-4">
                <img 
                  src={supplier.image || FALLBACK_IMAGE} 
                  alt={supplier.name}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                {/* Status Badge */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm border border-white/20">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                    {supplier.tag}
                  </span>
                </div>
              </div>

              {/* Supplier Info */}
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {supplier.name}
                </h3>
                <ArrowRight className="w-5 h-5 text-slate-300 -rotate-45 group-hover:text-slate-900 transition-all" />
              </div>
              <p className="text-slate-400 text-sm font-medium leading-relaxed mb-4">
                {supplier.description}
              </p>
              <div className="flex items-center gap-2 text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-xs font-bold uppercase tracking-widest">{supplier.city}</span>
              </div>
            </motion.div>
          ))}
        </div>
        )}

        {!loading && fetchError && (
          <div className="text-center py-12 mb-8 rounded-3xl border border-amber-100 bg-amber-50">
            <p className="text-sm font-medium text-amber-900">{fetchError}</p>
          </div>
        )}

        {!loading && !fetchError && filteredSuppliers.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">No verified suppliers yet</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Verified supplier profiles appear here once approved on Alpha Freight. Try adjusting filters or join as a supplier.
            </p>
          </div>
        )}
      </main>

      {/* CTA Section */}
      <section className="bg-slate-900 py-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full -mr-20 -mt-20" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">
            Are you a <span className="text-blue-500 italic">Supplier?</span>
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto font-medium">
            Join the Alpha Freight supply chain network and reach industrial buyers across the globe.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/auth/signup?role=supplier"
              className="px-10 py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 hover:scale-105 transition-all uppercase tracking-widest text-xs"
            >
              Apply for Listing
            </a>
            <a 
              href="/support"
              className="px-10 py-5 bg-white/5 text-white border border-white/10 font-black rounded-2xl hover:bg-white/10 transition-all uppercase tracking-widest text-xs"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
