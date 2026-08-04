"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronLeft, 
  Trash2, 
  Truck, 
  MapPin, 
  ArrowRight,
  Bookmark,
  Search,
  Zap,
  CheckCircle2
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import type { PublicCarrierListing, PublicSupplierListing } from "@/lib/public-directory";

const FALLBACK_IMAGE = "/alpha freight truck.jpg";

type ShortlistItem = {
  id: string;
  type: "carrier" | "supplier";
  company_name: string;
  city: string;
  image: string | null;
  tag: string;
};

export default function ShortlistPage() {
  const router = useRouter();
  const [shortlistedItems, setShortlistedItems] = useState<ShortlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNotification, setShowNotification] = useState<string | null>(null);

  useEffect(() => {
    async function loadShortlist() {
      setLoading(true);

      try {
        const carrierIds = JSON.parse(localStorage.getItem("alpha_shortlist") || "[]") as string[];
        const supplierIds = JSON.parse(localStorage.getItem("alpha_supplier_shortlist") || "[]") as string[];

        const [carriersResponse, suppliersResponse] = await Promise.all([
          fetch("/api/public/carriers"),
          fetch("/api/public/suppliers"),
        ]);

        const carriersPayload = (await carriersResponse.json()) as { carriers?: PublicCarrierListing[] };
        const suppliersPayload = (await suppliersResponse.json()) as { suppliers?: PublicSupplierListing[] };

        const carriers = (carriersPayload.carriers ?? [])
          .filter((carrier) => carrierIds.includes(carrier.id))
          .map((carrier) => ({
            id: carrier.id,
            type: "carrier" as const,
            company_name: carrier.company_name,
            city: carrier.city,
            image: carrier.image,
            tag: carrier.tag,
          }));

        const suppliers = (suppliersPayload.suppliers ?? [])
          .filter((supplier) => supplierIds.includes(supplier.id))
          .map((supplier) => ({
            id: supplier.id,
            type: "supplier" as const,
            company_name: supplier.name,
            city: supplier.city,
            image: supplier.image,
            tag: supplier.tag,
          }));

        setShortlistedItems([...carriers, ...suppliers]);
      } finally {
        setLoading(false);
      }
    }

    loadShortlist();
  }, []);

  const removeFromShortlist = (id: string, type: 'carrier' | 'supplier', e: React.MouseEvent) => {
    e.stopPropagation();
    const storageKey = type === 'carrier' ? 'alpha_shortlist' : 'alpha_supplier_shortlist';
    const ids = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const newIds = ids.filter((sid: string) => sid !== id);
    localStorage.setItem(storageKey, JSON.stringify(newIds));
    
    setShortlistedItems(shortlistedItems.filter(item => !(item.id === id && item.type === type)));
    
    // Trigger navbar update
    window.dispatchEvent(new Event('alpha_shortlist_updated'));
    
    setShowNotification(`Removed from ${type} shortlist`);
    setTimeout(() => setShowNotification(null), 3000);
  };

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans">
      <Navbar variant="dark" />

      {/* Hero Section */}
      <section className="pt-48 pb-12 px-6 bg-white relative overflow-hidden border-b border-slate-50">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600/5 blur-[100px] rounded-full -mr-32 -mt-32" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <button 
                onClick={() => router.push('/directory')}
                className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-all mb-8 group"
              >
                <div className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center group-hover:border-slate-900 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </div>
                Back to Directory
              </button>
              
              <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[0.95]">
                Your Saved <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 italic font-serif font-light">Shortlist</span>
              </h1>
            </div>
            
            <div className="bg-slate-50 px-6 py-4 rounded-3xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                  <Bookmark className="w-5 h-5 text-white fill-white" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Saved</p>
                  <p className="text-xl font-black text-slate-900">{shortlistedItems.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-20 min-h-[400px]">
        {shortlistedItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {shortlistedItems.map((item, idx) => (
                <motion.div
                  key={`${item.type}-${item.id}`}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="group relative bg-white border border-slate-100 rounded-[32px] overflow-hidden hover:shadow-2xl hover:shadow-slate-200/50 transition-all cursor-pointer"
                  onClick={() => router.push(item.type === 'carrier' ? `/directory/${item.id}` : `/suppliers/${item.id}`)}
                >
                  <div className="aspect-[4/3] bg-white relative overflow-hidden flex items-center justify-center p-4">
                    <img 
                      src={item.image || FALLBACK_IMAGE} 
                      alt={item.company_name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button 
                        onClick={(e) => removeFromShortlist(item.id, item.type as 'carrier' | 'supplier', e)}
                        className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-white transition-all shadow-sm"
                        title="Remove from shortlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="absolute bottom-4 left-4 flex gap-2">
                      <span className={`px-3 py-1 text-white text-[9px] font-black uppercase tracking-widest rounded-full ${item.type === 'carrier' ? 'bg-blue-600' : 'bg-amber-500'}`}>
                        {item.type}
                      </span>
                      <span className="px-3 py-1 bg-slate-900/90 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-widest rounded-full">
                        {item.tag}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-8">
                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {item.company_name}
                    </h3>
                    <div className="flex items-center gap-2 text-slate-400 mb-4">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">{item.city}</span>
                    </div>
                    <button className="w-full py-4 bg-slate-50 text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest group-hover:bg-blue-600 group-hover:text-white transition-all flex items-center justify-center gap-2">
                      View Profile <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-32 bg-white border border-dashed border-slate-200 rounded-[40px]"
          >
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bookmark className="w-8 h-8 text-slate-200" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Shortlist is empty</h3>
            <p className="text-slate-400 text-sm mb-10 max-w-sm mx-auto font-medium">
              You haven't saved any partners yet. Explore the directories to find and save your favorite partners.
            </p>
            <div className="flex items-center justify-center gap-4">
              <button 
                onClick={() => router.push('/directory')}
                className="px-8 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-blue-600 transition-all uppercase tracking-widest text-[10px]"
              >
                Carriers
              </button>
              <button 
                onClick={() => router.push('/suppliers')}
                className="px-8 py-4 bg-amber-500 text-white font-black rounded-2xl shadow-xl hover:bg-amber-600 transition-all uppercase tracking-widest text-[10px]"
              >
                Suppliers
              </button>
            </div>
          </motion.div>
        )}
      </main>

      {/* Instant Quote CTA */}
      {shortlistedItems.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 mb-32">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-[48px] p-12 text-white relative overflow-hidden shadow-2xl shadow-blue-500/20">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[100px] rounded-full -mr-32 -mt-32" />
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
              <div className="max-w-xl">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-8">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight leading-tight">
                  Request Quotes from all <br /> 
                  <span className="opacity-60">your shortlisted partners</span>
                </h2>
                <p className="text-blue-100 text-lg font-medium opacity-80 leading-relaxed">
                  Send your requirements to all {shortlistedItems.length} saved partners at once and get the best rates within minutes.
                </p>
              </div>
              <a
                href={`mailto:support@alphafreightuk.com?subject=${encodeURIComponent("Bulk quote request from shortlist")}&body=${encodeURIComponent(`Hello Alpha Freight team,\n\nI would like quotes from my shortlisted partners (${shortlistedItems.length}).\n\nThanks,`)}`}
                className="px-12 py-6 bg-white text-blue-600 font-black rounded-[24px] shadow-2xl hover:scale-105 transition-all uppercase tracking-[0.2em] text-xs whitespace-nowrap inline-block"
              >
                Send Bulk Request
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Premium Notification Toast */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-12 left-1/2 z-[100] bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10"
          >
            <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest">{showNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
