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

// We need the carrier data to display their info
const MOCK_CARRIERS = [
  {
    id: "amz-prep",
    company_name: "AMZ Prep | Best 3PL Provider",
    city: "Brampton, Canada",
    image: "/AMZ Prep.png",
    tag: "Premier Verified",
    description: "AMZ Prep is a leading USA 3PL, Canada 3PL, and ecommerce 3PL partner for Amazon-first brands."
  },
  {
    id: "synex-logistics",
    company_name: "SYNEX Logistics",
    city: "Kyiv, Ukraine",
    image: "/SYNEX Logistics.png",
    tag: "3PL Operator",
    description: "Improving efficiency with logistics. Multimodal, transport and contract logistics services since 2009."
  },
  {
    id: "jmd-haulage",
    company_name: "JMD Haulage Contractors",
    city: "Liverpool, England",
    image: "/JMD Haulage Contractors.png",
    tag: "Family Run",
    description: "Family-run transport business with over 40 years of experience. Large independent container haulier."
  },
  {
    id: "ws-transportation",
    company_name: "WS Transportation",
    city: "Barnton, England",
    image: "/WS Transportation.png",
    tag: "High & Heavy",
    description: "Specialists in construction industry logistics and high & heavy haulage across the UK."
  },
  {
    id: "wt-transport",
    company_name: "WT TRANSPORT",
    city: "Northampton, England",
    image: "/WT TRANSPORT.png",
    tag: "FORS Silver",
    description: "Road haulage and warehousing service provider based in Northampton, specializing in comprehensive logistics solutions."
  },
  {
    id: "transporter-eng",
    company_name: "Transporter Engineering Limited",
    city: "Braintree, England",
    image: "/Transporter Engineering Limited.png",
    tag: "Engineering",
    description: "Manufacturer specializing in high-quality British-built mechanical and industrial engineering products."
  },
  {
    id: "carntyne-transport",
    company_name: "Carntyne Transport",
    city: "Glasgow, Scotland",
    image: "/Carntyne Transport.png",
    tag: "Bulk Liquid",
    description: "Leading third-party logistics provider specializing in bulk liquid transport and bonded cask warehousing."
  },
  {
    id: "major-freight",
    company_name: "MAJOR FREIGHT SERVICES LTD",
    city: "Newtownabbey, Northern Ireland",
    image: "/MAJOR FREIGHT SERVICES LTD.png",
    tag: "Montgomery Group",
    description: "Part of Montgomery Transport Group, specializing in integrated transport and logistics solutions across the UK, Ireland, and Europe."
  },
  {
    id: "road-transport-media",
    company_name: "Road Transport Media",
    city: "Sutton, England",
    image: "/Road Transport Media.png",
    tag: "DVV Media",
    description: "Publisher and service provider specializing in the road transport and logistics industry, featuring Commercial Motor and Motor Transport."
  },
  {
    id: "1",
    company_name: "Street Stream",
    city: "London",
    image: "/street stream.png",
    tag: "Featured",
    description: "Specializing in same day courier and last mile carrier services in London."
  }
];

const MOCK_SUPPLIERS = [
  {
    id: "british-steel",
    name: "British Steel",
    city: "Scunthorpe, United Kingdom",
    category: "Steel",
    services: ["Manufacturing", "Fabrication", "Raw Materials"],
    rating: 4.9,
    reviews: 1250,
    is_verified: true,
    tag: "Primary Producer",
    image: "/British Steel.png",
    description: "British Steel is a leading steel manufacturer in Europe, producing around 3 million tonnes of high-quality steel products annually."
  },
  {
    id: "barrett-steel",
    name: "Barrett Steel",
    city: "Bradford-on-Tone, United Kingdom",
    category: "Steel",
    services: ["General Steels", "Engineering Steels", "Tubes"],
    rating: 4.8,
    reviews: 426,
    is_verified: true,
    tag: "Tier 1 Supplier",
    image: "/Barrett Steel.png",
    description: "Barrett Steel is the UK's largest independent steel stockholder, specializing in a wide range of products and services."
  },
  {
    id: "parker-steel",
    name: "JOHN PARKER & SON LIMITED",
    city: "Canterbury, United Kingdom",
    category: "Steel",
    services: ["Laser Cutting", "Steel Processing", "Stockholding"],
    rating: 4.7,
    reviews: 89,
    is_verified: true,
    tag: "Tier 1 Supplier",
    image: "/JOHN PARKER & SON LIMITED1.png",
    description: "ParkerSteel Limited specializing in a comprehensive range of steel products and services."
  },
  {
    id: "advanced-fab",
    name: "MS Companies",
    city: "Indianapolis, United States",
    category: "Manufacturing",
    services: ["Workforce Solutions", "Inspection", "Containment"],
    rating: 4.8,
    reviews: 768,
    is_verified: true,
    tag: "Service Provider",
    image: "/MS Companies.png",
    description: "MS Companies is a data-driven technology company and service provider that specializes in building data and quality infrastructures for manufacturers."
  },
  {
    id: "manufactory",
    name: "Manufactory",
    city: "Cheltenham, United Kingdom",
    category: "Manufacturing",
    services: ["Precision Machined", "Smart Factories", "AI-driven decisions"],
    rating: 4.8,
    reviews: 4,
    is_verified: true,
    tag: "Service Provider",
    image: "/Manufactory.png",
    description: "Manufactory is a provider of advanced manufacturing solutions, specializing in the development of a factory operating system."
  },
  {
    id: "contracts-engineering",
    name: "Contracts Engineering Limited",
    city: "Sittingbourne, United Kingdom",
    category: "Fabrication",
    services: ["Laser Cutting", "Metal Fabrication", "Powder Coating"],
    rating: 4.8,
    reviews: 56,
    is_verified: true,
    tag: "Tier 1 Supplier",
    image: "/Contracts Engineering Limited.png",
    description: "Contracts Engineering Limited is a precision metal fabrication company specializing in laser cutting, folding, and welding services."
  },
  {
    id: "wcm",
    name: "WCM",
    city: "Basildon, United Kingdom",
    category: "Automotive",
    services: ["Metal Production", "Plastic Parts", "3D Printing"],
    rating: 3.7,
    reviews: 7,
    is_verified: true,
    tag: "Manufacturer",
    image: "/WCM.png",
    description: "WCM is a world-class manufacturer specializing in the production of metal and plastic parts, assemblies, and systems for the automotive industry."
  },
  {
    id: "fabricon-design",
    name: "Fabricon Design",
    city: "Tameside, United Kingdom",
    category: "Manufacturing",
    services: ["Design & Prototyping", "CNC Machining", "Injection Molding"],
    rating: 5.0,
    reviews: 3,
    is_verified: true,
    tag: "Manufacturer",
    image: "/Fabricon Design.png",
    description: "Fabricon Design is a manufacturer and service provider specializing in design, prototyping, and production services for a diverse range of products."
  },
  {
    id: "beck-pollitzer",
    name: "Beck & Pollitzer",
    city: "Dartford, United Kingdom",
    category: "Industrial",
    services: ["Industrial Installation", "Machinery Relocation", "Engineering Solutions"],
    rating: 3.0,
    reviews: 2,
    is_verified: true,
    tag: "Service Provider",
    image: "/Beck & Pollitzer.png",
    description: "Beck & Pollitzer is a leading provider of complex engineering solutions specializing in industrial installation and relocation services."
  }
];

export default function ShortlistPage() {
  const router = useRouter();
  const [shortlistedItems, setShortlistedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNotification, setShowNotification] = useState<string | null>(null);

  useEffect(() => {
    const carrierIds = JSON.parse(localStorage.getItem('alpha_shortlist') || '[]');
    const supplierIds = JSON.parse(localStorage.getItem('alpha_supplier_shortlist') || '[]');
    
    const carriers = MOCK_CARRIERS.filter(c => carrierIds.includes(c.id)).map(c => ({ ...c, type: 'carrier' }));
    const suppliers = MOCK_SUPPLIERS.filter(s => supplierIds.includes(s.id)).map(s => ({ ...s, company_name: s.name, type: 'supplier' }));
    
    setShortlistedItems([...carriers, ...suppliers]);
    setLoading(false);
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
                      src={item.image} 
                      alt={item.company_name}
                      className={`w-full h-full transition-transform duration-700 ${
                        item.id === "transporter-eng" || item.id === "major-freight" || item.id === "road-transport-media" || item.type === 'supplier' ? "object-contain scale-75" : "object-cover group-hover:scale-105"
                      }`}
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
              <button className="px-12 py-6 bg-white text-blue-600 font-black rounded-[24px] shadow-2xl hover:scale-105 transition-all uppercase tracking-[0.2em] text-xs whitespace-nowrap">
                Send Bulk Request
              </button>
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
