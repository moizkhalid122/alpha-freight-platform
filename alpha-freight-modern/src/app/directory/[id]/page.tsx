"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from "framer-motion";

// Dynamically import Map components to avoid SSR issues
const MapComponent = dynamic(() => import('react-map-gl/mapbox').then(mod => {
  const { Map } = mod;
  return function MapWrapper(props: any) {
    return <Map {...props} />;
  };
}), { ssr: false });

const Marker = dynamic(() => import('react-map-gl/mapbox').then(mod => mod.Marker), { ssr: false });
const NavigationControl = dynamic(() => import('react-map-gl/mapbox').then(mod => mod.NavigationControl), { ssr: false });

import 'mapbox-gl/dist/mapbox-gl.css';

import { 
  Truck, 
  MapPin, 
  Star, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Globe, 
  ChevronLeft,
  Calendar,
  Package,
  CheckCircle2,
  Info,
  Clock,
  ArrowRight,
  Users,
  Building,
  DollarSign,
  Bookmark,
  ChevronRight,
  Share2,
  MessageSquare,
  Send,
  MessageCircle,
  Minus
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

import { MAPBOX_TOKEN } from "@/lib/mapbox";

// Mock data for initial development
const MOCK_CARRIERS = [
  {
    id: "amz-prep",
    company_name: "AMZ Prep | Best 3PL Provider for FBA & eCommerce",
    logo: "/AMZ Prep.png",
    city: "Brampton, Canada +12",
    address: "Brampton, Canada",
    service_areas: ["USA", "Canada", "UK", "EU", "Australia"],
    vehicle_types: ["3PL Fulfillment", "FBA Prep", "B2B"],
    rating: 4.9,
    reviews: 90,
    is_verified: true,
    tag: "Premier Verified",
    description: "AMZ Prep is a leading USA 3PL, Canada 3PL, and ecommerce 3PL partner for Amazon-first and omnichannel brands scaling past $5M ARR. Since 2016, we've grown into 50+ fulfillment centers across the US, Canada, UK, EU, and Australia, moving $3B+ in annual commerce.",
    phone: "Undisclosed",
    email: "contact@amzprep.com",
    website: "https://amzprep.com/?utm_source=alphafreightuk.com&utm_medium=referral&utm_campaign=directory",
    joined_date: "90 reviews • 69 connections joined AMZ Prep's Network",
    completed_loads: 100,
    fleet_size: "250 - 999 Employees",
    min_project_size: "$1,000+",
    hourly_rate: "< $25 / hr",
    year_founded: "Founded 2016",
    social_proof: "90 reviews • Premier Verified",
    services: [
      { name: "Fulfillment", value: 50, color: "#1E40AF" },
      { name: "Warehousing & Distribution", value: 20, color: "#1E3A8A" },
      { name: "Freight forwarding", value: 10, color: "#065F46" },
      { name: "Logistics & Supply Chain Consulting", value: 10, color: "#10B981" },
      { name: "Trucking", value: 10, color: "#34D399" }
    ],
    focus: [
      { name: "LTL (Less than truckload shipping)", value: 100, color: "#1E40AF" }
    ],
    industries: [
      { name: "eCommerce", value: 100, color: "#1E40AF" }
    ],
    clients: [
      { name: "Small Business (<$10M)", value: 60, color: "#1E40AF" },
      { name: "Midmarket ($10M - $1B)", value: 40, color: "#1E3A8A" }
    ],
    locations: [
      {
        id: "hq",
        name: "Headquarters",
        address: "9 Van Der Graaf Court, Brampton, Canada L6T 5E5",
        employees: "50 - 75",
        phone: "(647) 692-2647",
        lat: 43.7315,
        lng: -79.7624,
        is_hq: true
      },
      {
        id: "montreal",
        name: "Montréal, Canada",
        address: "Montréal, QC, Canada",
        employees: "20 - 30",
        phone: "(647) 692-2647",
        lat: 45.5017,
        lng: -73.5673
      },
      {
        id: "toronto",
        name: "Toronto, Canada",
        address: "Toronto, ON, Canada",
        employees: "30 - 45",
        phone: "(647) 692-2647",
        lat: 43.6532,
        lng: -79.3832
      },
      {
        id: "vancouver",
        name: "Vancouver, Canada",
        address: "Vancouver, BC, Canada",
        employees: "15 - 25",
        phone: "(647) 692-2647",
        lat: 49.2827,
        lng: -123.1207
      },
      {
        id: "calgary",
        name: "Calgary, Canada",
        address: "Calgary, AB, Canada",
        employees: "10 - 20",
        phone: "(647) 692-2647",
        lat: 51.0447,
        lng: -114.0719
      }
    ]
  },
  {
    id: "jmd-haulage",
    company_name: "JMD Haulage Contractors",
    logo: "/JMD Haulage Contractors.png",
    city: "Liverpool, England",
    address: "Saturn Business Park, School Lane, Liverpool, England, L1",
    service_areas: ["UK Wide"],
    vehicle_types: ["Trucking", "Freight forwarding", "Warehousing & Distribution"],
    rating: 0,
    reviews: 0,
    is_verified: true,
    tag: "Family Run",
    description: "JMD Haulage is a family-run transport business and has over forty years of experience in the transport industry. We now operate a modern fleet of 75 x 44-ton trucks and is one of the largest independent container hauliers in the region.",
    phone: "0151 547 6740",
    email: "contact@jmdhaulage.co.uk",
    website: "https://www.jmdhaulage.co.uk/?utm_source=alphafreightuk.com&utm_medium=referral&utm_campaign=directory",
    joined_date: "Not yet reviewed",
    completed_loads: 75,
    fleet_size: "2 - 9 Employees",
    min_project_size: "Undisclosed",
    hourly_rate: "Undisclosed",
    year_founded: "Founded 1978",
    social_proof: "40+ years experience • Family Run",
    services: [
      { name: "Trucking", value: 70, color: "#1E40AF" },
      { name: "Freight forwarding", value: 20, color: "#1E3A8A" },
      { name: "Warehousing & Distribution", value: 10, color: "#065F46" }
    ],
    focus: [
      { name: "Container Haulage", value: 100, color: "#1E40AF" }
    ],
    industries: [
      { name: "Transport", value: 100, color: "#1E40AF" }
    ],
    clients: [
      { name: "Small Business (<$10M)", value: 80, color: "#1E40AF" },
      { name: "Midmarket ($10M - $1B)", value: 20, color: "#1E3A8A" }
    ],
    locations: [
      {
        id: "hq",
        name: "Headquarters",
        address: "Saturn Business Park, School Lane, Liverpool, England, L1",
        employees: "2 - 5",
        phone: "0151 547 6740",
        lat: 53.4084,
        lng: -2.9916,
        is_hq: true
      }
    ]
  },
  {
    id: "synex-logistics",
    company_name: "SYNEX Logistics",
    logo: "/SYNEX Logistics.png",
    city: "Kyiv, Ukraine +2",
    address: "Kyiv, Ukraine",
    service_areas: ["Czech Republic", "Ukraine", "Kazakhstan", "Poland"],
    vehicle_types: ["Multimodal logistics", "Transport logistics", "Contract logistics"],
    rating: 4.8,
    reviews: 11,
    is_verified: true,
    tag: "3PL Operator",
    description: "SYNEX Logistics provides its services all over the world. Today, we have offices in the Czech Republic, Ukraine, Kazakhstan, Poland. Since 2009 in the Outsourcing market.",
    phone: "+380800209787",
    email: "contact@synexlogistics.com",
    website: "https://synexlogistics.com/?utm_source=alphafreightuk.com&utm_medium=referral&utm_campaign=directory",
    joined_date: "11 reviews • 9 connections joined SYNEX Logistics's Network",
    completed_loads: 50,
    fleet_size: "50 - 249 Employees",
    min_project_size: "$5,000+",
    hourly_rate: "$25 - $49 / hr",
    year_founded: "Founded 2022",
    social_proof: "11 reviews • 3PL Operator",
    services: [
      { name: "Freight forwarding", value: 40, color: "#1E40AF" },
      { name: "Trucking", value: 30, color: "#1E3A8A" },
      { name: "Air Freight", value: 10, color: "#065F46" },
      { name: "Contract Manufacturing", value: 10, color: "#10B981" },
      { name: "Ocean Freight", value: 10, color: "#34D399" }
    ],
    focus: [
      { name: "LTL (Less than truckload shipping)", value: 100, color: "#1E40AF" }
    ],
    industries: [
      { name: "Logistics", value: 100, color: "#1E40AF" }
    ],
    clients: [
      { name: "Small Business (<$10M)", value: 50, color: "#1E40AF" },
      { name: "Midmarket ($10M - $1B)", value: 50, color: "#1E3A8A" }
    ],
    locations: [
      {
        id: "hq",
        name: "Headquarters",
        address: "120 Saksahanskoho Street, Kyiv, Ukraine 02000",
        employees: "76 - 100",
        phone: "+380800209787",
        lat: 50.4501,
        lng: 30.5234,
        is_hq: true
      },
      {
        id: "prague",
        name: "Prague, Czech Republic",
        address: "Prague, Czech Republic",
        employees: "10 - 20",
        phone: "+380800209787",
        lat: 50.0755,
        lng: 14.4378
      },
      {
        id: "almaty",
        name: "Almaty, Kazakhstan",
        address: "Almaty, Kazakhstan",
        employees: "15 - 25",
        phone: "+380800209787",
        lat: 43.2220,
        lng: 76.8512
      }
    ]
  },
  {
    id: "ws-transportation",
    company_name: "WS Transportation",
    logo: "/WS Transportation.png",
    city: "Barnton, England",
    address: "Weaver Park Industrial Estate, Barnton, United Kingdom",
    service_areas: ["UK Wide"],
    vehicle_types: ["Flatbed", "High & Heavy Haulage", "Machinery Transport"],
    rating: 3.4,
    reviews: 173,
    is_verified: true,
    tag: "High & Heavy",
    description: "WS Transportation is a logistics company specializing in the construction industry and high & heavy haulage. As a service provider, we offer a diverse range of logistics services across the UK, including flat bed transport, general ambient transport, high & heavy machinery transport, building transport, specialist lifting, and warehousing & contract logistics. We focus on delivering tailored transport solutions and maintain a dedicated 24/7 customer service department to provide up-to-date information and support for both drivers and customers.",
    phone: "Undisclosed",
    email: "marketing@wstransportation.com",
    website: "https://wstransportation.com/?utm_source=alphafreightuk.com&utm_medium=referral&utm_campaign=directory",
    joined_date: "173 reviews • Founded 2014",
    completed_loads: 500,
    fleet_size: "101 - 250 Employees",
    min_project_size: "£1,000+",
    hourly_rate: "Undisclosed",
    year_founded: "Founded 2014",
    social_proof: "173 reviews • Construction Specialists",
    services: [
      { name: "Heavy Haulage", value: 40, color: "#1E40AF" },
      { name: "Flatbed Transport", value: 30, color: "#1E3A8A" },
      { name: "Warehousing", value: 15, color: "#065F46" },
      { name: "Contract Logistics", value: 15, color: "#10B981" }
    ],
    focus: [
      { name: "Construction Logistics", value: 100, color: "#1E40AF" }
    ],
    industries: [
      { name: "Construction", value: 70, color: "#1E40AF" },
      { name: "Industrial", value: 30, color: "#1E3A8A" }
    ],
    clients: [
      { name: "Midmarket ($10M - $1B)", value: 60, color: "#1E40AF" },
      { name: "Enterprise (>$1B)", value: 40, color: "#1E3A8A" }
    ],
    locations: [
      {
        id: "hq",
        name: "Headquarters",
        address: "Weaver Park Industrial Estate, Barnton, United Kingdom",
        employees: "101 - 250",
        phone: "Undisclosed",
        lat: 53.2715,
        lng: -2.5458,
        is_hq: true
      }
    ]
  },
  {
    id: "wt-transport",
    company_name: "WT TRANSPORT",
    logo: "/WT TRANSPORT.png",
    city: "Northampton, England",
    address: "Tithe Barn Way, Swan Valley, Northampton, United Kingdom",
    service_areas: ["UK Wide"],
    vehicle_types: ["Road Haulage", "Warehousing", "Palletized Freight"],
    rating: 3.8,
    reviews: 106,
    is_verified: true,
    tag: "FORS Silver",
    description: "WT Transport is a road haulage and warehousing service provider based in Northampton, specializing in comprehensive logistics solutions. The company operates a modern fleet of over 50 commercial vehicles, including 3.5-tonne vans and 44-tonne articulated trucks. With 163,000 square feet of warehouse space featuring 10,000 racked spaces, WT Transport offers services like container de-stuffing, pick, pack, dispatch, and fulfillment. As a proud member of THE Pallet Network, they are committed to delivering tailored, high-quality, and cost-effective logistics services.",
    phone: "+441604702090",
    email: "sales@wttransport.com",
    website: "https://wttransport.com/?utm_source=alphafreightuk.com&utm_medium=referral&utm_campaign=directory",
    joined_date: "106 reviews • Founded 1996",
    completed_loads: 300,
    fleet_size: "51 - 100 Employees",
    min_project_size: "£500+",
    hourly_rate: "Undisclosed",
    year_founded: "Founded 1996",
    social_proof: "106 reviews • FORS Silver Accredited",
    services: [
      { name: "Road Haulage", value: 50, color: "#1E40AF" },
      { name: "Warehousing", value: 30, color: "#1E3A8A" },
      { name: "Pallet Network", value: 20, color: "#065F46" }
    ],
    focus: [
      { name: "General Haulage", value: 100, color: "#1E40AF" }
    ],
    industries: [
      { name: "Logistics", value: 60, color: "#1E40AF" },
      { name: "Retail", value: 40, color: "#1E3A8A" }
    ],
    clients: [
      { name: "Small Business (<$10M)", value: 40, color: "#1E40AF" },
      { name: "Midmarket ($10M - $1B)", value: 60, color: "#1E3A8A" }
    ],
    locations: [
      {
        id: "hq",
        name: "Headquarters",
        address: "Tithe Barn Way, Swan Valley, Northampton, United Kingdom",
        employees: "51 - 100",
        phone: "+441604702090",
        lat: 52.2227,
        lng: -0.9634,
        is_hq: true
      }
    ]
  },
  {
    id: "transporter-eng",
    company_name: "Transporter Engineering Limited",
    logo: "/Transporter Engineering Limited.png",
    city: "Braintree, England",
    address: "The Old Airfield, Gosfield, Halstead, Braintree, United Kingdom",
    service_areas: ["UK Wide", "Europe"],
    vehicle_types: ["Mechanical Engineering", "Industrial Engineering", "Product Development"],
    rating: 3.0,
    reviews: 22,
    is_verified: true,
    tag: "Engineering Excellence",
    description: "Transporter is a manufacturer specializing in high-quality British-built mechanical and industrial engineering products. The company is committed to ongoing product development and exceptional customer service, providing a range of aftersales services including repairs, maintenance, refurbishment, refinishing, and supply of parts and accessories. Transporter emphasizes flexibility, cost-effectiveness, and quality in its offerings, ensuring continued support for customers throughout the lifecycle of its products.",
    phone: "+441787478490",
    email: "info@transporter-eng.com",
    website: "https://www.transporter-eng.com/?utm_source=alphafreightuk.com&utm_medium=referral&utm_campaign=directory",
    joined_date: "22 reviews • Founded 2010",
    completed_loads: 150,
    fleet_size: "51 - 100 Employees",
    min_project_size: "£5,000+",
    hourly_rate: "Undisclosed",
    year_founded: "Founded 2010",
    social_proof: "22 reviews • Engineering Specialists",
    services: [
      { name: "Manufacturing", value: 60, color: "#1E40AF" },
      { name: "Engineering", value: 30, color: "#1E3A8A" },
      { name: "Aftersales Support", value: 10, color: "#065F46" }
    ],
    focus: [
      { name: "Product Development", value: 100, color: "#1E40AF" }
    ],
    industries: [
      { name: "Manufacturing", value: 100, color: "#1E40AF" }
    ],
    clients: [
      { name: "Midmarket ($10M - $1B)", value: 70, color: "#1E40AF" },
      { name: "Enterprise (>$1B)", value: 30, color: "#1E3A8A" }
    ],
    locations: [
      {
        id: "hq",
        name: "Headquarters",
        address: "The Old Airfield, Gosfield, Halstead, Braintree, United Kingdom",
        employees: "51 - 100",
        phone: "+441787478490",
        lat: 51.9333,
        lng: 0.5833,
        is_hq: true
      }
    ]
  },
  {
    id: "carntyne-transport",
    company_name: "Carntyne Transport",
    logo: "/Carntyne Transport.png",
    city: "Glasgow, Scotland",
    address: "440 Petershill Rd, Glasgow G21, United Kingdom",
    service_areas: ["UK Wide"],
    vehicle_types: ["Bulk Liquid Transport", "Bonded Warehousing", "On-site Logistics"],
    rating: 4.1,
    reviews: 55,
    is_verified: true,
    tag: "Bulk Liquid Specialists",
    description: "Carntyne Transport is a leading third-party logistics provider specializing in bulk liquid transport and the provision of on-site logistics and bonded cask warehousing. With over 50 years of experience in the transport industry, the company offers flexible, integrated logistics solutions tailored to customer needs. Additionally, Carntyne Transport operates commercial vehicle workshops in Glasgow, Coatbridge, and Alloa, providing maintenance, repair, and fabrication services. The company is a manufacturer and service provider, delivering high-quality logistics and supply chain services.",
    phone: "+441415581166",
    email: "info@carntyne-transport.co.uk",
    website: "https://www.carntyne-transport.co.uk/?utm_source=alphafreightuk.com&utm_medium=referral&utm_campaign=directory",
    joined_date: "55 reviews • Founded 1957",
    completed_loads: 450,
    fleet_size: "51 - 100 Employees",
    min_project_size: "£1,000+",
    hourly_rate: "Undisclosed",
    year_founded: "Founded 1957",
    social_proof: "55 reviews • 50+ Years Experience",
    services: [
      { name: "Bulk Liquid Transport", value: 50, color: "#1E40AF" },
      { name: "Bonded Warehousing", value: 30, color: "#1E3A8A" },
      { name: "On-site Logistics", value: 20, color: "#065F46" }
    ],
    focus: [
      { name: "Drinks Industry Logistics", value: 100, color: "#1E40AF" }
    ],
    industries: [
      { name: "Logistics", value: 100, color: "#1E40AF" }
    ],
    clients: [
      { name: "Midmarket ($10M - $1B)", value: 60, color: "#1E40AF" },
      { name: "Enterprise (>$1B)", value: 40, color: "#1E3A8A" }
    ],
    locations: [
      {
        id: "hq",
        name: "Headquarters",
        address: "440 Petershill Rd, Glasgow G21, United Kingdom",
        employees: "51 - 100",
        phone: "+441415581166",
        lat: 55.8833,
        lng: -4.2167,
        is_hq: true
      }
    ]
  },
  {
    id: "major-freight",
    company_name: "MAJOR FREIGHT SERVICES LTD",
    logo: "/MAJOR FREIGHT SERVICES LTD.png",
    city: "Newtownabbey, Northern Ireland",
    address: "Houstons Corner, Doagh Rd, Newtownabbey, United Kingdom",
    service_areas: ["UK Wide", "Ireland", "Europe"],
    vehicle_types: ["Integrated Transport", "Palletized Distribution", "Temperature-controlled Logistics"],
    rating: 4.9,
    reviews: 87,
    is_verified: true,
    tag: "Montgomery Group",
    description: "Montgomery Transport Group is a service provider specializing in integrated transport and logistics solutions. Established in 1970 and part of the Ballyvesey Holdings family-owned group, the company offers a range of services including full and part load transportation across the UK, Ireland, and Europe, palletized distribution, bulk tanks distribution, and temperature-controlled logistics. Additionally, Montgomery Transport provides high-security transportation solutions using specialist trailers. The company also engages in truck sales, trailer manufacturing through its sister company Montracon, and transport industry services, contributing to a comprehensive offering within the transport sector.",
    phone: "Undisclosed",
    email: "sales@montgomerytransport.com",
    website: "https://montgomerytransportgroup.com/?utm_source=alphafreightuk.com&utm_medium=referral&utm_campaign=directory",
    joined_date: "87 reviews • Founded 1970",
    completed_loads: 1000,
    fleet_size: "1001 - 5000 Employees",
    min_project_size: "£1,000+",
    hourly_rate: "Undisclosed",
    year_founded: "Founded 1970",
    social_proof: "87 reviews • Montgomery Group Specialists",
    services: [
      { name: "Integrated Transport", value: 40, color: "#1E40AF" },
      { name: "Palletized Distribution", value: 30, color: "#1E3A8A" },
      { name: "Temp-controlled", value: 30, color: "#065F46" }
    ],
    focus: [
      { name: "European Logistics", value: 100, color: "#1E40AF" }
    ],
    industries: [
      { name: "Logistics", value: 100, color: "#1E40AF" }
    ],
    clients: [
      { name: "Midmarket ($10M - $1B)", value: 40, color: "#1E40AF" },
      { name: "Enterprise (>$1B)", value: 60, color: "#1E3A8A" }
    ],
    locations: [
      {
        id: "hq",
        name: "Headquarters",
        address: "Houstons Corner, Doagh Rd, Newtownabbey, United Kingdom",
        employees: "1001 - 5000",
        phone: "Undisclosed",
        lat: 54.7000,
        lng: -5.9333,
        is_hq: true
      }
    ]
  },
  {
    id: "road-transport-media",
    company_name: "Road Transport Media",
    logo: "/Road Transport Media.png",
    city: "Sutton, England",
    address: "Sixth Floor, Chancery House, St Nicholas Way, Sutton, United Kingdom",
    service_areas: ["UK Wide"],
    vehicle_types: ["Media Publishing", "Industry Events", "Advertising"],
    rating: 4.0,
    reviews: 14,
    is_verified: true,
    tag: "DVV Media",
    description: "Road Transport Media, a division of DVV Media International Ltd, is a publisher and service provider specializing in the road transport and logistics industry. The company offers a comprehensive portfolio including magazines such as Commercial Motor, Motor Transport, and Truck & Driver, alongside detailed websites that feature breaking news, multimedia content, and forums for industry professionals. They provide advertising opportunities and gather decision-makers through various events, including Tip-ex, Tank-ex, Freight in the City, and the Motor Transport Awards, catering to a wide range of audiences from haulage company executives to commercial vehicle drivers. Their services focus on facilitating connections and providing insights within the road transport sector.",
    phone: "+442089122120",
    email: "info@roadtransportmedia.co.uk",
    website: "https://motortransport.co.uk/media-centre?utm_source=alphafreightuk.com&utm_medium=referral&utm_campaign=directory",
    joined_date: "14 reviews • Founded 2011",
    completed_loads: 0,
    fleet_size: "51 - 100 Employees",
    min_project_size: "Undisclosed",
    hourly_rate: "Undisclosed",
    year_founded: "Founded 2011",
    social_proof: "14 reviews • Industry Insights Specialist",
    services: [
      { name: "Media Publishing", value: 50, color: "#1E40AF" },
      { name: "Events Management", value: 30, color: "#1E3A8A" },
      { name: "Advertising", value: 20, color: "#065F46" }
    ],
    focus: [
      { name: "Industry Networking", value: 100, color: "#1E40AF" }
    ],
    industries: [
      { name: "Media", value: 100, color: "#1E40AF" }
    ],
    clients: [
      { name: "Small Business (<$10M)", value: 30, color: "#1E40AF" },
      { name: "Midmarket ($10M - $1B)", value: 70, color: "#1E3A8A" }
    ],
    locations: [
      {
        id: "hq",
        name: "Headquarters",
        address: "Sixth Floor, Chancery House, St Nicholas Way, Sutton, United Kingdom",
        employees: "51 - 100",
        phone: "+442089122120",
        lat: 51.3667,
        lng: -0.1917,
        is_hq: true
      }
    ]
  },
  {
    id: "1",
    company_name: "Street Stream",
    logo: "/street stream.png",
    city: "London, England",
    address: "Greater London Area",
    service_areas: ["London", "Greater London"],
    vehicle_types: ["On-demand Delivery", "Sameday Delivery", "Last Mile Carrier"],
    rating: 0,
    reviews: 0,
    is_verified: true,
    description: "Street Stream is a same day courier and last mile carrier operating in the Greater London area. We specialise in on-demand deliveries, sameday deliveries and pre-booked multiple drop circuits. Our customers either book through our website or they can integrate our API.",
    phone: "Undisclosed",
    email: "contact@streetstream.com",
    website: "https://www.streetstream.co.uk/?utm_source=alphafreightuk.com&utm_medium=referral&utm_campaign=directory",
    joined_date: "Not yet reviewed",
    completed_loads: 5,
    fleet_size: "2-9 Employees",
    min_project_size: "Undisclosed",
    hourly_rate: "Undisclosed",
    year_founded: "Not specified",
    social_proof: "5 successful loads • Partner since 2023",
    services: [
      { name: "Trucking", value: 75, color: "#1E40AF" },
      { name: "Logistics & Supply Chain Consulting", value: 25, color: "#1E3A8A" }
    ],
    focus: [
      { name: "LTL (Less than truckload shipping)", value: 100, color: "#1E40AF" }
    ],
    industries: [
      { name: "Arts, entertainment & music", value: 20, color: "#1E40AF" },
      { name: "Business services", value: 20, color: "#1E3A8A" },
      { name: "Consumer products & services", value: 20, color: "#065F46" },
      { name: "Retail", value: 20, color: "#10B981" },
      { name: "eCommerce", value: 20, color: "#34D399" }
    ],
    clients: [
      { name: "Small Business (<$10M)", value: 70, color: "#1E40AF" },
      { name: "Midmarket ($10M - $1B)", value: 30, color: "#1E3A8A" }
    ]
  }
];

export default function CarrierProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [carrier, setCarrier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Services");
  const [showContactForm, setShowContactForm] = useState(false);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [showNotification, setShowNotification] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [mapViewState, setMapViewState] = useState({
    latitude: 43.7315,
    longitude: -79.7624,
    zoom: 10
  });

  useEffect(() => {
    const found = MOCK_CARRIERS.find(c => c.id === id);
    if (found) {
      setCarrier(found);
      
      // Check shortlist status from localStorage
      const shortlist = JSON.parse(localStorage.getItem('alpha_shortlist') || '[]');
      setIsShortlisted(shortlist.includes(found.id));

      if (found.locations && found.locations.length > 0) {
        setSelectedLocation(found.locations[0]);
        setMapViewState({
          latitude: found.locations[0].lat,
          longitude: found.locations[0].lng,
          zoom: 10
        });
      }
    }
    setLoading(false);
  }, [id]);

  const handleLocationClick = (loc: any) => {
    setSelectedLocation(loc);
    setMapViewState({
      latitude: loc.lat,
      longitude: loc.lng,
      zoom: 12
    });
  };

  const handleShare = (platform: string) => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = `Check out ${carrier.company_name} on Alpha Freight!`;
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    }
  };

  const toggleShortlist = () => {
    const shortlist = JSON.parse(localStorage.getItem('alpha_shortlist') || '[]');
    let newShortlist;
    
    if (isShortlisted) {
      newShortlist = shortlist.filter((id: string) => id !== carrier.id);
      setShowNotification("Removed from shortlist");
    } else {
      newShortlist = [...shortlist, carrier.id];
      setShowNotification("Added to shortlist");
    }
    
    localStorage.setItem('alpha_shortlist', JSON.stringify(newShortlist));
    setIsShortlisted(!isShortlisted);
    
    // Trigger navbar update
    window.dispatchEvent(new Event('alpha_shortlist_updated'));
    
    // Auto-hide notification
    setTimeout(() => setShowNotification(null), 3000);
  };

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>;
  }

  if (!carrier) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <h1 className="text-2xl font-black mb-4">Carrier Not Found</h1>
        <button onClick={() => router.push('/directory')} className="text-blue-600 font-bold flex items-center gap-2">
          <ChevronLeft className="w-4 h-4" /> Back to Directory
        </button>
      </div>
    );
  }

  const relatedCarriers = MOCK_CARRIERS.filter(c => c.id !== carrier.id).slice(0, 2);

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans">
      <Navbar variant="dark" />

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Top Actions */}
          <div className="flex justify-between items-center mb-8">
            <button 
              onClick={() => router.push('/directory')}
              className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-all group"
            >
              <div className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center group-hover:border-slate-900 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </div>
              Back to Directory
            </button>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => handleShare('whatsapp')}
                className="p-2 text-slate-400 hover:text-green-500 transition-colors"
                title="Share on WhatsApp"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
              <button 
                onClick={() => handleShare('linkedin')}
                className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                title="Share on LinkedIn"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button 
                onClick={toggleShortlist}
                className={`flex items-center gap-2 text-xs font-bold transition-all ${
                  isShortlisted ? "text-blue-600" : "text-red-500 hover:text-red-600"
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isShortlisted ? "fill-blue-600" : ""}`} />
                {isShortlisted ? "Shortlisted" : "Add to Shortlist"}
              </button>
            </div>
          </div>

          {/* Premium Notification Toast */}
          <AnimatePresence>
            {showNotification && (
              <motion.div
                initial={{ opacity: 0, y: 50, x: '-50%' }}
                animate={{ opacity: 1, y: 0, x: '-50%' }}
                exit={{ opacity: 0, y: 20, x: '-50%' }}
                className="fixed bottom-24 left-1/2 z-[100] bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10"
              >
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest">{showNotification}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Profile Header */}
          <section className="mb-12">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="w-24 h-24 bg-white rounded-2xl border border-slate-100 p-2 shadow-sm flex items-center justify-center">
                {carrier.logo ? (
                  <img src={carrier.logo} alt={carrier.company_name} className="max-w-full max-h-full object-contain" />
                ) : (
                  <Truck className="w-10 h-10 text-blue-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-black text-slate-900">{carrier.company_name}</h1>
                  {carrier.is_verified && <ShieldCheck className="w-6 h-6 text-blue-500" />}
                </div>
                
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <div className="flex items-center gap-1">
                    <Star className={`w-4 h-4 ${carrier.rating > 0 ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                    <span className="text-sm font-bold text-slate-600">
                      {carrier.rating > 0 ? carrier.rating : 'Not yet reviewed'}
                    </span>
                  </div>
                  <span className="text-slate-300">|</span>
                  <span className="text-sm font-bold text-blue-600">{carrier.social_proof}</span>
                  {carrier.reviews === 0 && (
                    <button className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-slate-50 text-slate-400 rounded-full border border-slate-100 hover:bg-slate-100 hover:text-slate-600 transition-all ml-2">
                      Be the first to review
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={() => setShowContactForm(!showContactForm)}
                    className="px-8 py-3 bg-red-600 text-white rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-red-700 transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Contact Carrier
                  </button>
                  <button 
                    onClick={() => window.open(carrier.website, '_blank')}
                    className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-lg font-bold text-sm hover:bg-slate-50 transition-all"
                  >
                    Visit Website
                  </button>
                  <button 
                    onClick={() => router.push('/auth/signup?role=carrier')}
                    className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-lg font-bold text-sm hover:bg-slate-50 transition-all"
                  >
                    + Join Network
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Form Overlay */}
          <AnimatePresence>
            {showContactForm && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-12 overflow-hidden"
              >
                <div className="bg-white border border-blue-100 rounded-[32px] p-8 shadow-xl shadow-blue-500/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full" />
                  <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                    <Send className="w-5 h-5 text-blue-500" />
                    Message {carrier.company_name}
                  </h3>
                  <form className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    <div className="space-y-4">
                      <input type="text" placeholder="Your Name" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                      <input type="email" placeholder="Email Address" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                      <input type="tel" placeholder="Phone Number" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div className="space-y-4">
                      <textarea placeholder="Tell them about your project..." className="w-full h-32 bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"></textarea>
                      <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all">
                        Send Message
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
            {/* Left Info */}
            <div className="space-y-12">
              <section>
                <h2 className="text-2xl font-black text-slate-900 mb-6">Same day couriers London</h2>
                <p className="text-slate-600 text-base leading-relaxed mb-10">
                  {carrier.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Min project size</p>
                      <p className="text-sm font-bold text-slate-700">{carrier.min_project_size}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hourly rate</p>
                      <p className="text-sm font-bold text-slate-700">{carrier.hourly_rate}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Employees</p>
                      <p className="text-sm font-bold text-slate-700">{carrier.fleet_size}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Locations</p>
                      <p className="text-sm font-bold text-slate-700">{carrier.city}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Year founded</p>
                      <p className="text-sm font-bold text-slate-700">{carrier.year_founded}</p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Right Chart Card */}
            <div className="space-y-8">
              <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden flex flex-col h-fit">
                {/* Tabs */}
                <div className="flex border-b border-slate-50">
                  {["Services", "Focus", "Industries", "Clients"].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${
                        activeTab === tab ? "bg-slate-50 text-slate-900 border-b-2 border-slate-900" : "text-slate-400 hover:text-slate-600"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Content */}
                <div className="p-8">
                  {carrier && carrier[activeTab.toLowerCase()] ? (
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                      <div className="w-48 h-48 relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={carrier[activeTab.toLowerCase()]}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {carrier[activeTab.toLowerCase()].map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 w-full space-y-4">
                        {activeTab === "Focus" && (
                          <div className="mb-6">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Select Focus Area</p>
                            <div className="relative">
                              <select className="w-full bg-slate-50 border border-slate-100 rounded-lg py-2 px-4 text-xs font-bold text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all">
                                <option>Load Type</option>
                              </select>
                              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 rotate-90 text-slate-400 pointer-events-none" />
                            </div>
                          </div>
                        )}
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">
                          {activeTab === "Services" ? "Service Lines" : activeTab}
                        </h4>
                        {carrier[activeTab.toLowerCase()].map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between group cursor-default">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                              <span className="text-xs font-bold text-slate-500 group-hover:text-slate-900 transition-colors">{item.name}</span>
                            </div>
                            <span className="text-xs font-black text-slate-900">{item.value}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="py-20 text-center">
                      <Info className="w-10 h-10 text-slate-200 mx-auto mb-4" />
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No data available for {activeTab}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Trust & Verification Sidebar Card */}
              <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-3xl rounded-full" />
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Verification</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                    <ShieldCheck className="w-5 h-5 text-blue-400" />
                    <span className="text-xs font-bold">Identity Verified</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs font-bold">Insurance Valid</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Location Section */}
          <section className="mb-20">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Location</h3>
              <div className="w-8 h-px bg-slate-200" />
            </div>

            <div className="bg-white border border-slate-100 rounded-[40px] overflow-hidden shadow-sm flex flex-col lg:flex-row h-[550px]">
              {/* Sidebar: Locations List */}
              <div className="w-full lg:w-96 border-r border-slate-50 flex flex-col h-full bg-slate-50/30">
                <div className="p-6 border-b border-slate-50 bg-white">
                  <h4 className="text-sm font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest">
                    Locations <span className="text-slate-400 font-bold">({carrier.locations?.length || 0})</span>
                  </h4>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-2">
                  {carrier.locations?.map((loc: any) => (
                    <button
                      key={loc.id}
                      onClick={() => handleLocationClick(loc)}
                      className={`w-full text-left p-4 rounded-2xl transition-all duration-300 border ${
                        selectedLocation?.id === loc.id 
                          ? "bg-white border-slate-200 shadow-xl shadow-slate-200/40 scale-[1.01]" 
                          : "bg-transparent border-transparent hover:bg-white/50"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-3">
                          <MapPin className={`w-4 h-4 ${selectedLocation?.id === loc.id ? "text-red-500 fill-red-500" : "text-slate-400"}`} />
                          <span className={`text-xs font-bold ${selectedLocation?.id === loc.id ? "text-slate-900" : "text-slate-600"}`}>
                            {loc.name}
                          </span>
                        </div>
                        <div className="w-5 h-5 rounded-full border border-emerald-100 bg-emerald-50 flex items-center justify-center">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        </div>
                      </div>
                      
                      {selectedLocation?.id === loc.id && (
                        <motion.div 
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4 pt-3 pl-7"
                        >
                          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{loc.address}</p>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2.5">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-[10px] font-bold text-slate-700">{loc.employees}</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-[10px] font-bold text-slate-700">{loc.phone}</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main: Map */}
              <div className="flex-1 relative bg-slate-100">
                <MapComponent
                  {...mapViewState}
                  onMove={(evt: any) => setMapViewState(evt.viewState)}
                  style={{ width: '100%', height: '100%' }}
                  mapStyle="mapbox://styles/mapbox/light-v11"
                  mapboxAccessToken={MAPBOX_TOKEN}
                >
                  <NavigationControl position="top-right" />
                  
                  {carrier.locations?.map((loc: any) => (
                    <Marker
                      key={loc.id}
                      latitude={loc.lat}
                      longitude={loc.lng}
                      anchor="bottom"
                      onClick={(e: any) => {
                        e.originalEvent.stopPropagation();
                        handleLocationClick(loc);
                      }}
                    >
                      <div className="relative group cursor-pointer">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
                          selectedLocation?.id === loc.id ? "bg-red-500 scale-110" : "bg-slate-900/80 backdrop-blur-sm hover:bg-red-400"
                        }`}>
                          <MapPin className="w-5 h-5 text-white fill-white" />
                        </div>
                        
                        {/* Custom Popup/Tooltip style */}
                        {selectedLocation?.id === loc.id && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-5 w-60 bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 z-50">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                                <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{loc.name}</span>
                              </div>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium mb-4 leading-relaxed pl-5">{loc.address}</p>
                            <div className="space-y-2.5 border-t border-slate-50 pt-4 pl-5">
                              <div className="flex items-center gap-2.5">
                                <Users className="w-3 h-3 text-slate-400" />
                                <span className="text-[9px] font-bold text-slate-700">{loc.employees}</span>
                              </div>
                              <div className="flex items-center gap-2.5">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span className="text-[9px] font-bold text-slate-700">{loc.phone}</span>
                              </div>
                            </div>
                            {/* Triangle Arrow */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-[10px] border-transparent border-t-white shadow-2xl" />
                          </div>
                        )}
                      </div>
                    </Marker>
                  ))}
                </MapComponent>
              </div>
            </div>
          </section>

          {/* Related Carriers Section */}
          <section className="border-t border-slate-100 pt-20">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Related Carriers in <span className="text-blue-600">{carrier.city.split(',')[0]}</span></h3>
              <button onClick={() => router.push('/directory')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-all">View All</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {relatedCarriers.map((rc: any) => (
                <div 
                  key={rc.id}
                  onClick={() => router.push(`/directory/${rc.id}`)}
                  className="bg-white border border-slate-100 rounded-[32px] p-8 flex items-center gap-6 cursor-pointer hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 group"
                >
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                    {rc.logo ? <img src={rc.logo} alt={rc.company_name} className="w-full h-full object-cover" /> : <Truck className="w-8 h-8 text-blue-600" />}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{rc.company_name}</h4>
                    <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> {rc.city}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-slate-900 transition-all" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
