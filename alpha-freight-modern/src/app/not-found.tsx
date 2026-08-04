import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-6 pt-32 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#BFFF07]">404</p>
        <h1 className="mt-6 text-5xl md:text-7xl font-medium tracking-tighter uppercase">
          Page not found
        </h1>
        <p className="mt-6 max-w-xl text-white/45 leading-relaxed">
          The page you requested doesn&apos;t exist or may have moved. Head back to the marketplace or contact our team if you need help.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/"
            className="rounded-full bg-[#BFFF07] px-6 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-black"
          >
            Go home
          </Link>
          <Link
            href="/support"
            className="rounded-full border border-white/20 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white/80 hover:text-white"
          >
            Get support
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
