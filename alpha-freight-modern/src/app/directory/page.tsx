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
  ArrowRight
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/lib/supabase";

// Mock data for initial development/display
const MOCK_CARRIERS = [
  {
    id: "amz-prep",
    company_name: "AMZ Prep | Best 3PL Provider",
    city: "Brampton, Canada",
    service_areas: ["USA", "Canada", "UK", "EU", "Australia"],
    vehicle_types: ["3PL", "Fulfillment", "FBA Prep"],
    rating: 4.9,
    reviews: 90,
    is_verified: true,
    tag: "Premier Verified",
    image: "/AMZ Prep.png",
    description: "AMZ Prep is a leading USA 3PL, Canada 3PL, and ecommerce 3PL partner for Amazon-first brands."
  },
  {
    id: "synex-logistics",
    company_name: "SYNEX Logistics",
    city: "Kyiv, Ukraine",
    service_areas: ["Czech Republic", "Ukraine", "Kazakhstan", "Poland"],
    vehicle_types: ["Logistics", "Multimodal", "Transport", "Contract Logistics"],
    rating: 4.8,
    reviews: 11,
    is_verified: true,
    tag: "3PL Operator",
    image: "/SYNEX Logistics.png",
    description: "Improving efficiency with logistics. Multimodal, transport and contract logistics services since 2009."
  },
  {
    id: "jmd-haulage",
    company_name: "JMD Haulage Contractors",
    city: "Liverpool, England",
    service_areas: ["UK Wide"],
    vehicle_types: ["Haulage", "Trucking", "Container Haulier"],
    rating: 4.9,
    reviews: 0,
    is_verified: true,
    tag: "Family Run",
    image: "/JMD Haulage Contractors.png",
    description: "Family-run transport business with over 40 years of experience. Large independent container haulier."
  },
  {
    id: "ws-transportation",
    company_name: "WS Transportation",
    city: "Barnton, England",
    service_areas: ["UK Wide"],
    vehicle_types: ["Flatbed", "Heavy Haulage", "Machinery"],
    rating: 4.8,
    reviews: 173,
    is_verified: true,
    tag: "High & Heavy",
    image: "/WS Transportation.png",
    description: "Specialists in construction industry logistics and high & heavy haulage across the UK."
  },
  {
    id: "wt-transport",
    company_name: "WT TRANSPORT",
    city: "Northampton, England",
    service_areas: ["UK Wide"],
    vehicle_types: ["Haulage", "Warehousing", "Pallet Network"],
    rating: 4.7,
    reviews: 106,
    is_verified: true,
    tag: "FORS Silver",
    image: "/WT TRANSPORT.png",
    description: "Road haulage and warehousing service provider based in Northampton, specializing in comprehensive logistics solutions."
  },
  {
    id: "transporter-eng",
    company_name: "Transporter Engineering Limited",
    city: "Braintree, England",
    service_areas: ["UK", "Europe"],
    vehicle_types: ["Manufacturing", "Engineering", "Repairs"],
    rating: 4.6,
    reviews: 22,
    is_verified: true,
    tag: "Engineering",
    image: "/Transporter Engineering Limited.png",
    description: "Manufacturer specializing in high-quality British-built mechanical and industrial engineering products."
  },
  {
    id: "carntyne-transport",
    company_name: "Carntyne Transport",
    city: "Glasgow, Scotland",
    service_areas: ["UK Wide"],
    vehicle_types: ["Bulk Liquid", "Warehousing", "On-site Logistics"],
    rating: 4.8,
    reviews: 55,
    is_verified: true,
    tag: "Bulk Liquid",
    image: "/Carntyne Transport.png",
    description: "Leading third-party logistics provider specializing in bulk liquid transport and bonded cask warehousing."
  },
  {
    id: "major-freight",
    company_name: "MAJOR FREIGHT SERVICES LTD",
    city: "Newtownabbey, Northern Ireland",
    service_areas: ["UK", "Ireland", "Europe"],
    vehicle_types: ["Integrated Transport", "Logistics", "Temperature-controlled"],
    rating: 4.9,
    reviews: 87,
    is_verified: true,
    tag: "Montgomery Group",
    image: "/MAJOR FREIGHT SERVICES LTD.png",
    description: "Part of Montgomery Transport Group, specializing in integrated transport and logistics solutions across the UK, Ireland, and Europe."
  },
  {
    id: "road-transport-media",
    company_name: "Road Transport Media",
    city: "Sutton, England",
    service_areas: ["UK Wide"],
    vehicle_types: ["Logistics", "Media", "Publishing", "Events"],
    rating: 4.5,
    reviews: 14,
    is_verified: true,
    tag: "DVV Media",
    image: "/Road Transport Media.png",
    description: "Publisher and service provider specializing in the road transport and logistics industry, featuring Commercial Motor and Motor Transport."
  },
  {
    id: "1",
    company_name: "Street Stream",
    city: "London",
    service_areas: ["London", "Greater London"],
    vehicle_types: ["Haulage", "On-demand Delivery", "Sameday Delivery"],
    rating: 4.9,
    reviews: 128,
    is_verified: true,
    tag: "Featured",
    image: "/street stream.png",
    description: "Specializing in same day courier and last mile carrier services in London."
  }
];

export default function DirectoryPage() {
  const router = useRouter();
  const [carriers, setCarriers] = useState(MOCK_CARRIERS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [selectedVehicle, setSelectedVehicle] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    async function fetchCarriers() {
      // In a real app, we would fetch from Supabase
      // const { data, error } = await supabase
      //   .from('carriers')
      //   .select('*')
      //   .eq('is_approved', true);
      // if (data) setCarriers(data);
    }
    fetchCarriers();
  }, []);

  const filteredCarriers = carriers.filter(carrier => {
    const matchesSearch = carrier.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         carrier.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = selectedCity === "All Cities" || carrier.city === selectedCity;
    const matchesVehicle = selectedVehicle === "All" || carrier.vehicle_types.includes(selectedVehicle);
    
    return matchesSearch && matchesCity && matchesVehicle;
  });

  const cities = ["All Cities", ...Array.from(new Set(carriers.map(c => c.city)))];
  const vehicleTypes = ["All", "3PL", "Haulage", "Heavy Haulage", "Warehousing", "Logistics", "Engineering"];

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
              className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-white shadow-lg shadow-slate-950/15 mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Verified Carrier Network</span>
            </motion.div>
            
            <h1 className="text-6xl md:text-7xl font-black tracking-tight text-slate-900 mb-6 leading-[0.95]">
              Find your next <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 italic font-serif font-light">logistics partner</span>
            </h1>
            
            <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-2xl mx-auto">
              Browse our curated gallery of professional carriers. Every partner is pre-vetted for quality, reliability, and safety compliance.
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
                placeholder="Search by company, city or vehicle..."
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
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filteredCarriers.length} Carriers Available</p>
              </div>
            </div>
            
            {/* Horizontal Pills Filter */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button
                onClick={() => {
                  setSelectedCity("All Cities");
                  setSelectedVehicle("All");
                }}
                className={`px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                  selectedCity === "All Cities" && selectedVehicle === "All"
                    ? "bg-slate-900 border-slate-900 text-white shadow-lg"
                    : "bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-900"
                }`}
              >
                All
              </button>
              {vehicleTypes.slice(1).map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedVehicle(type)}
                  className={`px-6 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                    selectedVehicle === type 
                      ? "bg-slate-900 border-slate-900 text-white shadow-lg" 
                      : "bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:text-slate-900"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Listing Section */}
      <main className="max-w-7xl mx-auto px-6 pt-12 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
          {filteredCarriers.map((carrier, idx) => (
            <motion.div
              key={carrier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group cursor-pointer"
              onClick={() => router.push(`/directory/${carrier.id}`)}
            >
              {/* Card Image Wrapper */}
              <div className="relative aspect-[4/3] mb-6 overflow-hidden rounded-3xl bg-slate-100">
                <img 
                  src={carrier.image} 
                  alt={carrier.company_name}
                  className={`w-full h-full transition-transform duration-700 ease-out ${
                    carrier.id === "transporter-eng" || carrier.id === "major-freight" || carrier.id === "road-transport-media" ? "object-contain p-10" : "object-cover group-hover:scale-105"
                  }`}
                />
                {/* Status Badge */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                    {carrier.tag}
                  </span>
                </div>
              </div>

              {/* Company Info */}
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {carrier.company_name}
                </h3>
                <ArrowRight className="w-5 h-5 text-slate-300 -rotate-45 group-hover:text-slate-900 transition-all" />
              </div>
              <p className="text-slate-400 text-sm font-medium leading-relaxed">
                {carrier.description}
              </p>
            </motion.div>
          ))}
        </div>

        {filteredCarriers.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">No carriers found</h3>
            <p className="text-slate-400 text-sm">Try adjusting your search or filters to find what you're looking for.</p>
          </div>
        )}
      </main>

      {/* CTA Section */}
      <section className="bg-blue-600 py-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full -mr-20 -mt-20" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight">
            Are you a <span className="italic opacity-80">Carrier?</span>
          </h2>
          <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto">
            Get your company listed in our directory for free and connect with thousands of potential customers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/auth/signup?role=carrier"
              className="px-10 py-5 bg-white text-blue-600 font-black rounded-2xl shadow-xl hover:scale-105 transition-all uppercase tracking-widest text-xs"
            >
              Get Listed Now
            </a>
            <a 
              href="/support"
              className="px-10 py-5 bg-blue-700 text-white font-black rounded-2xl shadow-xl hover:bg-blue-800 transition-all uppercase tracking-widest text-xs"
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
