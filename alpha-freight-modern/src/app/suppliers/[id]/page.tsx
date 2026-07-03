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
  Factory, 
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
  Zap,
  Activity,
  Award,
  Lock,
  Download,
  Eye,
  Hammer,
  Layers,
  Settings,
  X
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

import { MAPBOX_TOKEN } from "@/lib/mapbox";

const MOCK_SUPPLIERS = [
  {
    id: "british-steel",
    company_name: "British Steel",
    logo: "/British Steel.png",
    city: "Scunthorpe, United Kingdom",
    address: "Brigg Rd, Scunthorpe DN16 1XA, United Kingdom",
    service_areas: ["UK", "Europe", "Global"],
    vehicle_types: ["Steel Production", "Manufacturing", "Rail"],
    rating: 4.9,
    reviews: 1250,
    is_verified: true,
    tag: "Primary Producer",
    description: "British Steel is a leading steel manufacturer in Europe, producing around 3 million tonnes of high-quality steel products annually, including over 1,450 specifications rolled into wire rod, sections, special profiles, rail, billet, bloom, and slab. The company specializes in high-performance rail products and offers technical consultancy services tailored for international high-speed, heavy-duty, mixed traffic, metro, and tramway networks. With manufacturing facilities across the UK and Europe, British Steel supplies premium long products globally and is committed to developing sustainable products and processes for a lower carbon future. Additionally, British Steel features a global network of regional sales teams to ensure localized customer service.",
    phone: "+44 1724 404040",
    email: "media@britishsteel.co.uk",
    website: "https://www.britishsteel.co.uk/?utm_source=alphafreightuk.com&utm_medium=referral&utm_campaign=directory",
    joined_date: "1250 reviews • Founded 2016",
    completed_loads: 5000,
    fleet_size: "1001 - 5000 Employees",
    min_project_size: "£10,000+",
    hourly_rate: "Contact for Pricing",
    year_founded: "Founded 2016",
    social_proof: "1250+ reviews • Primary Producer",
    services: [
      { name: "Structural Steel", value: 45, color: "#1E40AF" },
      { name: "Rail Products", value: 25, color: "#1E3A8A" },
      { name: "Wire Rod", value: 15, color: "#065F46" },
      { name: "Special Profiles", value: 15, color: "#10B981" }
    ],
    focus: [
      { name: "Industrial Supply", value: 100, color: "#1E40AF" }
    ],
    industries: [
      { name: "Mining", value: 60, color: "#1E40AF" },
      { name: "Manufacturing", value: 40, color: "#1E3A8A" }
    ],
    clients: [
      { name: "Enterprise (>$1B)", value: 80, color: "#1E40AF" },
      { name: "Midmarket ($10M - $1B)", value: 20, color: "#1E3A8A" }
    ],
    performance: [
      { label: "On-time Delivery", value: 98, color: "#3B82F6" },
      { label: "Quality Control", value: 99, color: "#10B981" },
      { label: "Supply Stability", value: 95, color: "#F59E0B" }
    ],
    locations: [
      {
        id: "hq",
        name: "Headquarters",
        address: "Brigg Rd, Scunthorpe DN16 1XA, United Kingdom",
        employees: "1001 - 5000",
        phone: "+44 1724 404040",
        lat: 53.5833,
        lng: -0.6500,
        is_hq: true
      }
    ]
  },
  {
    id: "barrett-steel",
    company_name: "Barrett Steel",
    logo: "/Barrett Steel.png",
    city: "Bradford-on-Tone, United Kingdom",
    address: "282 Cutler Heights Ln, Bradford, BD4 9JF, United Kingdom",
    service_areas: ["UK", "Europe", "Global"],
    vehicle_types: ["Steel Stockholder", "Engineering Steels", "Tubes", "Energy Products"],
    rating: 4.8,
    reviews: 426,
    is_verified: true,
    tag: "Tier 1 Supplier",
    description: "Barrett Steel is the UK's largest independent steel stockholder, specializing in a wide range of products and services within the steel industry. The company operates across four divisions: General Steels, Engineering Steels, Tubes, and Energy Products. With a strong commitment to technological innovation and customer service, Barrett Steel provides tailored steel solutions to meet specific requirements. Their offerings include various steel products and services, supported by a dedicated distribution fleet and extensive operations from 30 locations throughout the UK. As both a manufacturer and service provider, Barrett Steel is focused on delivering high-quality steel and exceptional customer support.",
    phone: "+44 1912 598200",
    email: "sales@barrettsteel.com",
    website: "https://www.barrettsteel.com/?utm_source=alphafreightuk.com&utm_medium=referral&utm_campaign=directory",
    joined_date: "426 reviews • Founded 1866",
    completed_loads: 8000,
    fleet_size: "1001 - 5000 Employees",
    min_project_size: "£25,000+",
    hourly_rate: "Contact for Pricing",
    year_founded: "Founded 1866",
    social_proof: "426+ reviews • Tier 1 Supplier",
    services: [
      { name: "General Steels", value: 40, color: "#1E40AF" },
      { name: "Engineering Steels", value: 30, color: "#1E3A8A" },
      { name: "Tubes", value: 20, color: "#065F46" },
      { name: "Energy Products", value: 10, color: "#10B981" }
    ],
    focus: [
      { name: "Industrial Supply", value: 100, color: "#1E40AF" }
    ],
    industries: [
      { name: "Mining", value: 100, color: "#1E40AF" }
    ],
    clients: [
      { name: "Enterprise (>$1B)", value: 90, color: "#1E40AF" },
      { name: "Midmarket ($10M - $1B)", value: 10, color: "#1E3A8A" }
    ],
    performance: [
      { label: "On-time Delivery", value: 96, color: "#3B82F6" },
      { label: "Quality Control", value: 97, color: "#10B981" },
      { label: "Supply Stability", value: 94, color: "#F59E0B" }
    ],
    locations: [
      {
        id: "hq",
        name: "Headquarters",
        address: "282 Cutler Heights Ln, Bradford, BD4 9JF, United Kingdom",
        employees: "1001 - 5000",
        phone: "+44 1912 598200",
        lat: 53.7938,
        lng: -1.7508,
        is_hq: true
      }
    ]
  },
  {
    id: "parker-steel",
    company_name: "JOHN PARKER & SON LIMITED",
    logo: "/JOHN PARKER & SON LIMITED1.png",
    city: "Canterbury, United Kingdom",
    address: "Vauxhall Industrial Rd, Canterbury, CT1 1HD, United Kingdom",
    service_areas: ["UK", "Europe", "Global"],
    vehicle_types: ["Steel Stockholding", "Processing", "Laser Cutting", "Plasma Cutting"],
    rating: 4.7,
    reviews: 89,
    is_verified: true,
    tag: "Tier 1 Supplier",
    description: "ParkerSteel Limited, trading as ParkerSteel & ParkerTools, is a manufacturer and distributor specializing in a comprehensive range of steel products and services. They offer steel stockholding, steel processing, and structural steel solutions, alongside a variety of metal materials including aluminium, stainless steel, and non-ferrous metals. Their services include advanced laser and plasma cutting, shotblasting, and steel fabrication, catering to the construction and industrial engineering sectors. In addition, they supply power tools, fixings, and abrasives, making them a one-stop shop for all workshop and site needs. Their industry-leading website facilitates easy online ordering, order tracking, and access to test certifications, enhancing the customer procurement experience.",
    phone: "+44 1227 783333",
    email: "sales@parkersteel.co.uk",
    website: "https://www.parkersteel.co.uk/?utm_source=alphafreightuk.com&utm_medium=referral&utm_campaign=directory",
    joined_date: "89 reviews • Founded 1960",
    completed_loads: 4500,
    fleet_size: "251 - 500 Employees",
    min_project_size: "£5,000+",
    hourly_rate: "Contact for Pricing",
    year_founded: "Founded 1960",
    social_proof: "89+ reviews • Tier 1 Supplier",
    services: [
      { name: "Laser Cutting", value: 35, color: "#1E40AF" },
      { name: "Steel Processing", value: 30, color: "#1E3A8A" },
      { name: "Stockholding", value: 20, color: "#065F46" },
      { name: "Fabrication", value: 15, color: "#10B981" }
    ],
    focus: [
      { name: "Industrial Supply", value: 100, color: "#1E40AF" }
    ],
    industries: [
      { name: "Manufacturing", value: 100, color: "#1E40AF" }
    ],
    clients: [
      { name: "Enterprise (>$1B)", value: 70, color: "#1E40AF" },
      { name: "Midmarket ($10M - $1B)", value: 30, color: "#1E3A8A" }
    ],
    performance: [
      { label: "On-time Delivery", value: 95, color: "#3B82F6" },
      { label: "Quality Control", value: 98, color: "#10B981" },
      { label: "Supply Stability", value: 93, color: "#F59E0B" }
    ],
    locations: [
      {
        id: "hq",
        name: "Headquarters",
        address: "Vauxhall Industrial Rd, Canterbury, CT1 1HD, United Kingdom",
        employees: "251 - 500",
        phone: "+44 1227 783333",
        lat: 51.2802,
        lng: 1.0789,
        is_hq: true
      }
    ]
  },
  {
    id: "advanced-fab",
    company_name: "MS Companies",
    logo: "/MS Companies.png",
    city: "Indianapolis, United States",
    address: "550 Congressional Blvd #230, Carmel, IN 46032, United States",
    service_areas: ["USA", "Global"],
    vehicle_types: ["Workforce Solutions", "Inspection", "Containment", "Job Training"],
    rating: 4.8,
    reviews: 768,
    is_verified: true,
    tag: "Service Provider",
    description: "MS Companies is a data-driven technology company and service provider that specializes in building data and quality infrastructures for manufacturers. The company offers workforce solutions, inspection and containment services, job training, and vocational rehabilitation services, primarily targeting industries such as automotive, food manufacturing, and oil and gas. Utilizing predictive analytics and a database of over 200,000 talent profiles, MS Companies helps clients identify ideal employees and enhances communication through employee engagement technology. Additionally, the company is ISO 9001:2008 certified and operates across a 14-state network, bridging the gap between manufacturing and technology.",
    phone: "+1 317-226-0000",
    email: "sales@mscompanies.com",
    website: "https://mscompanies.com/?utm_source=alphafreightuk.com&utm_medium=referral&utm_campaign=directory",
    joined_date: "768 reviews • Founded 1999",
    completed_loads: 3000,
    fleet_size: "1001 - 5000 Employees",
    min_project_size: "£5,000+",
    hourly_rate: "Contact for Pricing",
    year_founded: "Founded 1999",
    social_proof: "768+ reviews • Service Provider",
    services: [
      { name: "Workforce Solutions", value: 40, color: "#1E40AF" },
      { name: "Inspection & Containment", value: 40, color: "#1E3A8A" },
      { name: "Predictive Analytics", value: 20, color: "#065F46" }
    ],
    focus: [
      { name: "Quality Infrastructure", value: 100, color: "#1E40AF" }
    ],
    industries: [
      { name: "IT, Software and Services", value: 100, color: "#1E40AF" }
    ],
    clients: [
      { name: "Enterprise (>$1B)", value: 80, color: "#1E40AF" },
      { name: "Midmarket ($10M - $1B)", value: 20, color: "#1E3A8A" }
    ],
    performance: [
      { label: "On-time Delivery", value: 97, color: "#3B82F6" },
      { label: "Quality Control", value: 99, color: "#10B981" },
      { label: "Supply Stability", value: 95, color: "#F59E0B" }
    ],
    locations: [
      {
        id: "hq",
        name: "Headquarters",
        address: "550 Congressional Blvd #230, Carmel, IN 46032, United States",
        employees: "1001 - 5000",
        phone: "+1 317-226-0000",
        lat: 39.9783,
        lng: -86.1267,
        is_hq: true
      }
    ]
  },
  {
    id: "manufactory",
    company_name: "Manufactory",
    logo: "/Manufactory.png",
    city: "Cheltenham, United Kingdom",
    address: "Unit 27, Lansdown Industrial Estate, Cheltenham, GL51 8PL, United Kingdom",
    service_areas: ["UK", "Global"],
    vehicle_types: ["Smart Factories", "Precision Machined", "AI Operating Systems"],
    rating: 4.8,
    reviews: 4,
    is_verified: true,
    tag: "Service Provider",
    description: "Manufactory is a provider of advanced manufacturing solutions, specializing in the development of a factory operating system that empowers machines to make AI-driven decisions. The company focuses on optimizing efficiency, cost-effectiveness, and quality in the production of precision machined components. Leveraging over 50 years of collective experience in blue-chip manufacturing, Manufactory integrates artificial intelligence, machine learning, and blockchain technology to transform traditional manufacturing processes into smart factories, addressing critical issues in the industry.",
    phone: "+44 1242 000000",
    email: "info@manufactoryresearch.com",
    website: "https://manufactoryresearch.com/?utm_source=alphafreightuk.com&utm_medium=referral&utm_campaign=directory",
    joined_date: "4 reviews • Founded 2018",
    completed_loads: 1200,
    fleet_size: "11 - 50 Employees",
    min_project_size: "£1,000+",
    hourly_rate: "Contact for Pricing",
    year_founded: "Founded 2018",
    social_proof: "4+ reviews • Service Provider",
    services: [
      { name: "Smart Factories", value: 40, color: "#1E40AF" },
      { name: "AI Solutions", value: 40, color: "#1E3A8A" },
      { name: "Precision Machining", value: 20, color: "#065F46" }
    ],
    focus: [
      { name: "Manufacturing Tech", value: 100, color: "#1E40AF" }
    ],
    industries: [
      { name: "IT, Software and Services", value: 100, color: "#1E40AF" }
    ],
    clients: [
      { name: "Enterprise (>$1B)", value: 60, color: "#1E40AF" },
      { name: "Midmarket ($10M - $1B)", value: 40, color: "#1E3A8A" }
    ],
    performance: [
      { label: "On-time Delivery", value: 98, color: "#3B82F6" },
      { label: "Quality Control", value: 99, color: "#10B981" },
      { label: "Supply Stability", value: 96, color: "#F59E0B" }
    ],
    locations: [
      {
        id: "hq",
        name: "Headquarters",
        address: "Unit 27, Lansdown Industrial Estate, Cheltenham, GL51 8PL, United Kingdom",
        employees: "11 - 50",
        phone: "+44 1242 000000",
        lat: 51.9000,
        lng: -2.0833,
        is_hq: true
      }
    ]
  },
  {
    id: "contracts-engineering",
    company_name: "Contracts Engineering Limited",
    logo: "/Contracts Engineering Limited.png",
    city: "Sittingbourne, United Kingdom",
    address: "Unit 1, Trinity Trading Estate, Tribune Dr, Sittingbourne ME10 2PG, United Kingdom",
    service_areas: ["UK", "Europe"],
    vehicle_types: ["Laser Cutting", "Folding", "Welding", "Fabrication"],
    rating: 4.8,
    reviews: 56,
    is_verified: true,
    tag: "Tier 1 Supplier",
    description: "Contracts Engineering Limited is a premier precision metal fabrication company based in Kent, UK. Specializing in high-quality laser cutting, CNC folding, welding, and full assembly services, they serve a wide range of industries including construction, automotive, and industrial engineering. With a commitment to quality and precision, they utilize state-of-the-art machinery to deliver complex components and assemblies to tight tolerances. Their end-to-end service includes everything from design assistance to final powder coating, ensuring a seamless supply chain for their clients.",
    phone: "+44 1795 430399",
    email: "sales@contractsengineering.com",
    website: "https://www.contractsengineering.com/?utm_source=alphafreightuk.com&utm_medium=referral&utm_campaign=directory",
    joined_date: "56 reviews • Founded 1990",
    completed_loads: 3200,
    fleet_size: "51 - 200 Employees",
    min_project_size: "£2,500+",
    hourly_rate: "Contact for Pricing",
    year_founded: "Founded 1990",
    social_proof: "56+ reviews • Tier 1 Supplier",
    services: [
      { name: "Laser Cutting", value: 40, color: "#1E40AF" },
      { name: "CNC Folding", value: 25, color: "#1E3A8A" },
      { name: "Welding", value: 20, color: "#065F46" },
      { name: "Assembly", value: 15, color: "#10B981" }
    ],
    focus: [
      { name: "Precision Fabrication", value: 100, color: "#1E40AF" }
    ],
    industries: [
      { name: "Construction", value: 50, color: "#1E40AF" },
      { name: "Industrial", value: 50, color: "#1E3A8A" }
    ],
    clients: [
      { name: "Enterprise (>$1B)", value: 40, color: "#1E40AF" },
      { name: "Midmarket ($10M - $1B)", value: 60, color: "#1E3A8A" }
    ],
    performance: [
      { label: "On-time Delivery", value: 97, color: "#3B82F6" },
      { label: "Quality Control", value: 99, color: "#10B981" },
      { label: "Technical Support", value: 94, color: "#F59E0B" }
    ],
    locations: [
      {
        id: "hq",
        name: "Headquarters",
        address: "Unit 1, Trinity Trading Estate, Tribune Dr, Sittingbourne ME10 2PG, United Kingdom",
        employees: "51 - 200",
        phone: "+44 1795 430399",
        lat: 51.3444,
        lng: 0.7333,
        is_hq: true
      }
    ]
  },
  {
    id: "wcm",
    company_name: "WCM",
    logo: "/WCM.png",
    city: "Basildon, United Kingdom",
    address: "11 Fenton Way, Basildon SS15 6TD, United Kingdom",
    service_areas: ["UK", "China", "Global"],
    vehicle_types: ["Metal Parts", "Plastic Parts", "3D Printing", "Assemblies"],
    rating: 3.7,
    reviews: 7,
    is_verified: true,
    tag: "Manufacturer",
    description: "WCM is a world-class manufacturer specializing in the production of metal and plastic parts, assemblies, and systems for the automotive industry. Utilizing advanced manufacturing processes, including 3D printing, WCM provides rapid and efficient design, engineering, and manufacturing solutions to OEMs and Tier 1 suppliers. With facilities in the UK and China, the company emphasizes reliability and responsiveness, focusing on detail and refinement to meet the needs of leading global automotive brands.",
    phone: "+44 1268 288888",
    email: "info@wcm.com",
    website: "https://www.wcm.com/?utm_source=alphafreightuk.com&utm_medium=referral&utm_campaign=directory",
    joined_date: "7 reviews • Founded 1982",
    completed_loads: 2500,
    fleet_size: "101 - 250 Employees",
    min_project_size: "£5,000+",
    hourly_rate: "Contact for Pricing",
    year_founded: "Founded 1982",
    social_proof: "7+ reviews • Manufacturer",
    services: [
      { name: "Metal Production", value: 40, color: "#1E40AF" },
      { name: "Plastic Parts", value: 30, color: "#1E3A8A" },
      { name: "3D Printing", value: 20, color: "#065F46" },
      { name: "Assemblies", value: 10, color: "#10B981" }
    ],
    focus: [
      { name: "Automotive Manufacturing", value: 100, color: "#1E40AF" }
    ],
    industries: [
      { name: "Automotive", value: 100, color: "#1E40AF" }
    ],
    clients: [
      { name: "Enterprise (>$1B)", value: 70, color: "#1E40AF" },
      { name: "Midmarket ($10M - $1B)", value: 30, color: "#1E3A8A" }
    ],
    performance: [
      { label: "On-time Delivery", value: 95, color: "#3B82F6" },
      { label: "Quality Control", value: 98, color: "#10B981" },
      { label: "Technical Support", value: 92, color: "#F59E0B" }
    ],
    locations: [
      {
        id: "hq",
        name: "Headquarters",
        address: "11 Fenton Way, Basildon SS15 6TD, United Kingdom",
        employees: "101 - 250",
        phone: "+44 1268 288888",
        lat: 51.5761,
        lng: 0.4887,
        is_hq: true
      }
    ]
  },
  {
    id: "fabricon-design",
    company_name: "Fabricon Design",
    logo: "/Fabricon Design.png",
    city: "Tameside, United Kingdom",
    address: "The Wellington, Wellington Rd, Ashton-under-Lyne OL6 7DQ, United Kingdom",
    service_areas: ["UK", "Europe", "Global"],
    vehicle_types: ["Design & Prototyping", "CNC Machining", "Injection Molding", "Laser Cutting"],
    rating: 5.0,
    reviews: 3,
    is_verified: true,
    tag: "Manufacturer",
    description: "Fabricon Design is a manufacturer and service provider specializing in design, prototyping, and production services for a diverse range of products made from ferrous and non-ferrous metals and laminates, as well as plastic materials. Their offerings include 3D Computer Design using advanced CAD software, rapid prototyping, sampling, and full-scale production, alongside services such as jigs and tooling, product testing, and reverse engineering of obsolete parts. Fabricon is equipped with state-of-the-art facilities, including precision CNC machines, injection molding machines for batch production, laser engraving and cutting, and additive manufacturing technologies. The company serves a broad spectrum of industries, including healthcare, engineering, lighting, commercial building systems, and automotive, backed by certifications ISO9001:2015 and ISO14001:2015 to ensure high quality and environmental standards.",
    phone: "+44 1613 319797",
    email: "office@fabricon.co.uk",
    website: "https://fabricon.co.uk/?utm_source=alphafreightuk.com&utm_medium=referral&utm_campaign=directory",
    joined_date: "3 reviews • Founded 2006",
    completed_loads: 1800,
    fleet_size: "11 - 50 Employees",
    min_project_size: "£1,000+",
    hourly_rate: "Contact for Pricing",
    year_founded: "Founded 2006",
    social_proof: "3+ reviews • Manufacturer",
    services: [
      { name: "Design & Prototyping", value: 40, color: "#1E40AF" },
      { name: "CNC Machining", value: 30, color: "#1E3A8A" },
      { name: "Injection Molding", value: 20, color: "#065F46" },
      { name: "Laser Cutting", value: 10, color: "#10B981" }
    ],
    focus: [
      { name: "Precision Engineering", value: 100, color: "#1E40AF" }
    ],
    industries: [
      { name: "Manufacturing", value: 100, color: "#1E40AF" }
    ],
    clients: [
      { name: "SME (<$10M)", value: 60, color: "#1E40AF" },
      { name: "Midmarket ($10M - $1B)", value: 40, color: "#1E3A8A" }
    ],
    performance: [
      { label: "On-time Delivery", value: 98, color: "#3B82F6" },
      { label: "Quality Control", value: 99, color: "#10B981" },
      { label: "Design Accuracy", value: 97, color: "#F59E0B" }
    ],
    locations: [
      {
        id: "hq",
        name: "Headquarters",
        address: "The Wellington, Wellington Rd, Ashton-under-Lyne OL6 7DQ, United Kingdom",
        employees: "11 - 50",
        phone: "+44 1613 319797",
        lat: 53.4900,
        lng: -2.0933,
        is_hq: true
      }
    ]
  },
  {
    id: "beck-pollitzer",
    company_name: "Beck & Pollitzer",
    logo: "/Beck & Pollitzer.png",
    city: "Dartford, United Kingdom",
    address: "2nd Floor, Suite 2, Riverbridge House, Anchor Blvd, Dartford DA2 6SL, United Kingdom",
    service_areas: ["UK", "Europe", "Global"],
    vehicle_types: ["Industrial Installation", "Relocation", "Engineering", "Electrical Services"],
    rating: 3.0,
    reviews: 2,
    is_verified: true,
    tag: "Service Provider",
    description: "Beck & Pollitzer is a leading provider of complex engineering solutions specializing in industrial installation and relocation services. The company offers a wide range of services, including machinery manufacturing, machinery installation, electrical and mechanical services, control systems, equipment relocation, and machinery moving and removals. With a focus on warehouse automation and support for the FMCG sector, Beck & Pollitzer also provides expertise in mechanical and industrial engineering, battery and electrification solutions. The firm operates globally with over 1200 employees and more than 30 offices worldwide, providing localized knowledge and capabilities to meet client needs.",
    phone: "+44 1322 223444",
    email: "info@beck-pollitzer.com",
    website: "https://beck-pollitzer.com/?utm_source=alphafreightuk.com&utm_medium=referral&utm_campaign=directory",
    joined_date: "2 reviews • Founded 1863",
    completed_loads: 4200,
    fleet_size: "501 - 1000 Employees",
    min_project_size: "£10,000+",
    hourly_rate: "Contact for Pricing",
    year_founded: "Founded 1863",
    social_proof: "2+ reviews • Service Provider",
    services: [
      { name: "Industrial Installation", value: 40, color: "#1E40AF" },
      { name: "Machinery Relocation", value: 30, color: "#1E3A8A" },
      { name: "Engineering", value: 20, color: "#065F46" },
      { name: "Electrical Services", value: 10, color: "#10B981" }
    ],
    focus: [
      { name: "Engineering Solutions", value: 100, color: "#1E40AF" }
    ],
    industries: [
      { name: "Manufacturing", value: 100, color: "#1E40AF" }
    ],
    clients: [
      { name: "Enterprise (>$1B)", value: 80, color: "#1E40AF" },
      { name: "Midmarket ($10M - $1B)", value: 20, color: "#1E3A8A" }
    ],
    performance: [
      { label: "Installation Safety", value: 99, color: "#3B82F6" },
      { label: "Relocation Accuracy", value: 97, color: "#10B981" },
      { label: "Technical Support", value: 95, color: "#F59E0B" }
    ],
    locations: [
      {
        id: "hq",
        name: "Headquarters",
        address: "2nd Floor, Suite 2, Riverbridge House, Anchor Blvd, Dartford DA2 6SL, United Kingdom",
        employees: "501 - 1000",
        phone: "+44 1322 223444",
        lat: 51.4444,
        lng: 0.2222,
        is_hq: true
      }
    ]
  }
];

export default function SupplierProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [supplier, setSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Services");
  const [showContactForm, setShowContactForm] = useState(false);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [showNotification, setShowNotification] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [mapViewState, setMapViewState] = useState({
    latitude: 53.5833,
    longitude: -0.6500,
    zoom: 10
  });

  useEffect(() => {
    const found = MOCK_SUPPLIERS.find(s => s.id === id);
    if (found) {
      setSupplier(found);
      
      const shortlist = JSON.parse(localStorage.getItem('alpha_supplier_shortlist') || '[]');
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

  const toggleShortlist = () => {
    const shortlist = JSON.parse(localStorage.getItem('alpha_supplier_shortlist') || '[]');
    let newShortlist;
    if (isShortlisted) {
      newShortlist = shortlist.filter((sid: string) => sid !== supplier.id);
      setShowNotification("Removed from shortlist");
    } else {
      newShortlist = [...shortlist, supplier.id];
      setShowNotification("Added to shortlist");
    }
    localStorage.setItem('alpha_supplier_shortlist', JSON.stringify(newShortlist));
    setIsShortlisted(!isShortlisted);

    // Trigger navbar update
    window.dispatchEvent(new Event('alpha_shortlist_updated'));

    setTimeout(() => setShowNotification(null), 3000);
  };

  const handleShare = (platform: string) => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = `Check out ${supplier.company_name} on Alpha Freight!`;
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    }
  };

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>;
  if (!supplier) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-black mb-4">Supplier Not Found</h1>
      <button onClick={() => router.push('/suppliers')} className="text-blue-600 font-bold flex items-center gap-2">
        <ChevronLeft className="w-4 h-4" /> Back to Suppliers
      </button>
    </div>
  );

  const relatedSuppliers = MOCK_SUPPLIERS.filter(s => s.id !== supplier.id).slice(0, 2);

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans">
      <Navbar variant="dark" />

      {/* Sticky Bottom Action Bar */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-50 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="hidden md:flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center">
              <Factory className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">{supplier.company_name}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{supplier.city}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button className="flex-1 md:flex-none px-6 py-3 bg-slate-100 text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2">
              <Phone className="w-3.5 h-3.5" /> Call
            </button>
            <button 
              onClick={() => setShowContactForm(true)}
              className="flex-1 md:flex-none px-8 py-3 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" /> Message Supplier
            </button>
          </div>
        </div>
      </motion.div>

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Top Actions */}
          <div className="flex justify-between items-center mb-8">
            <button 
              onClick={() => router.push('/suppliers')}
              className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-all group"
            >
              <div className="w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center group-hover:border-slate-900 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </div>
              Back to Suppliers
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
              <div className="w-24 h-24 bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center justify-center overflow-hidden">
                {supplier.logo ? (
                  <img 
                      src={supplier.logo} 
                        alt={supplier.company_name} 
                        className={`max-w-full max-h-full ${supplier.id === 'parker-steel' || supplier.id === 'manufactory' || supplier.id === 'contracts-engineering' || supplier.id === 'wcm' || supplier.id === 'fabricon-design' || supplier.id === 'beck-pollitzer' ? 'object-contain scale-90' : 'object-contain'}`} 
                      />
                ) : (
                  <Factory className="w-10 h-10 text-blue-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-black text-slate-900">{supplier.company_name}</h1>
                  {supplier.is_verified && <ShieldCheck className="w-6 h-6 text-blue-500" />}
                </div>
                
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <div className="flex items-center gap-1">
                    <Star className={`w-4 h-4 ${supplier.rating > 0 ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                    <span className="text-sm font-bold text-slate-600">
                      {supplier.rating > 0 ? `${supplier.rating} (${supplier.reviews} reviews)` : 'Not yet reviewed'}
                    </span>
                  </div>
                  <span className="text-slate-300">|</span>
                  <span className="text-sm font-bold text-blue-600">{supplier.social_proof}</span>
                  {supplier.reviews === 0 && (
                    <button className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-slate-50 text-slate-400 rounded-full border border-slate-100 hover:bg-slate-100 hover:text-slate-600 transition-all ml-2">
                      Be the first to review
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={() => setShowContactForm(!showContactForm)}
                    className="px-8 py-3 bg-red-600 text-white rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-500/20"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Contact Supplier
                  </button>
                  <button 
                    onClick={() => window.open(supplier.website, '_blank')}
                    className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-lg font-bold text-sm hover:bg-slate-50 transition-all"
                  >
                    Visit Website
                  </button>
                  <button 
                    onClick={() => router.push('/auth/signup?role=supplier')}
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
                    Message {supplier.company_name}
                  </h3>
                  <form className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    <div className="space-y-4">
                      <input type="text" placeholder="Your Name" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                      <input type="email" placeholder="Email Address" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                      <input type="tel" placeholder="Phone Number" className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div className="space-y-4">
                      <textarea placeholder="Tell them about your requirements..." className="w-full h-32 bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"></textarea>
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
                <h2 className="text-2xl font-black text-slate-900 mb-6">Industrial Supply & Manufacturing</h2>
                <p className="text-slate-600 text-base leading-relaxed mb-10">
                  {supplier.description}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Min order size</p>
                      <p className="text-sm font-bold text-slate-700">{supplier.min_project_size}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Scale</p>
                      <p className="text-sm font-bold text-slate-700">{supplier.fleet_size}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Locations</p>
                      <p className="text-sm font-bold text-slate-700">{supplier.city}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Year founded</p>
                      <p className="text-sm font-bold text-slate-700">{supplier.year_founded}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Performance Gauges */}
              <section className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 blur-[100px] rounded-full" />
                <div className="flex items-center justify-between mb-10 relative z-10">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Supply chain metrics</h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">Reliability & Performance</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-slate-900" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                  {supplier.performance?.map((metric: any, i: number) => (
                    <div key={i} className="space-y-4">
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{metric.label}</span>
                        <span className="text-lg font-black text-slate-900">{metric.value}%</span>
                      </div>
                      <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100/50 p-[2px]">
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: `${metric.value}%` }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: metric.color }}
                        />
                      </div>
                    </div>
                  ))}
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
                  {supplier && supplier[activeTab.toLowerCase()] ? (
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                      <div className="w-48 h-48 relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={supplier[activeTab.toLowerCase()]}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {supplier[activeTab.toLowerCase()]?.map((entry: any, index: number) => (
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
                                <option>Supply Type</option>
                              </select>
                              <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 rotate-90 text-slate-400 pointer-events-none" />
                            </div>
                          </div>
                        )}
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">
                          {activeTab === "Services" ? "Service Lines" : activeTab}
                        </h4>
                        {supplier[activeTab.toLowerCase()]?.map((item: any, idx: number) => (
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
              <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 blur-3xl rounded-full" />
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Trust & Verification</h4>
                <div className="space-y-3 relative z-10">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ShieldCheck className="w-5 h-5 text-blue-500" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">Identity Verified</span>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Award className="w-5 h-5 text-emerald-500" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">Industrial License</span>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                </div>
              </div>

              {/* Next Level: Smart Quote CTA */}
              <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/10 blur-3xl rounded-full -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-700" />
                <div className="flex items-center gap-4 mb-4 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <Zap className="w-5 h-5 text-blue-500" />
                  </div>
                  <h4 className="text-xl font-black leading-tight">Need a quick quote for {supplier.company_name}?</h4>
                </div>
                <p className="text-sm text-slate-400 mb-8 font-medium leading-relaxed">Get competitive industrial pricing and supply timelines within 24 hours.</p>
                <button className="w-full py-4 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl shadow-black/20">
                  Request RFQ Now
                </button>
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
                    Locations <span className="text-slate-400 font-bold">({supplier.locations?.length || 0})</span>
                  </h4>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-2">
                  {supplier.locations?.map((loc: any) => (
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
                              <span className="text-[10px] font-bold text-slate-700">{loc.phone || supplier.phone}</span>
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
                  
                  {supplier.locations?.map((loc: any) => (
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
                                <span className="text-[9px] font-bold text-slate-700">{loc.phone || supplier.phone}</span>
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

          {/* Related Suppliers Section */}
          <section className="border-t border-slate-100 pt-20">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Related Suppliers in <span className="text-blue-600">{supplier.city.split(',')[0]}</span></h3>
              <button onClick={() => router.push('/suppliers')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-all">View All</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {relatedSuppliers.map((rs: any) => (
                <div 
                  key={rs.id}
                  onClick={() => router.push(`/suppliers/${rs.id}`)}
                  className="bg-white border border-slate-100 rounded-[32px] p-8 flex items-center gap-6 cursor-pointer hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 group"
                >
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 overflow-hidden">
                    {rs.logo ? <img src={rs.logo} alt={rs.company_name} className="w-full h-full object-cover" /> : <Factory className="w-8 h-8 text-blue-600" />}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{rs.company_name}</h4>
                    <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> {rs.city}</p>
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
