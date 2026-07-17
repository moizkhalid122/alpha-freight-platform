"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { blogArticles, blogCategories } from "@/lib/blog-content";

const categories = blogCategories;

type Category = (typeof categories)[number];

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("All");

  const filteredArticles = useMemo(() => {
    if (activeCategory === "All") {
      return blogArticles;
    }

    return blogArticles.filter((article) => article.category === activeCategory);
  }, [activeCategory]);

  return (
    <div className="min-h-screen bg-[#f5f5f2] text-black overflow-x-hidden">
      <Navbar variant="dark" />

      <main className="pt-28 md:pt-32">
        <section className="py-12 md:py-20">
          <div className="max-w-[1800px] mx-auto px-5 md:px-6 lg:px-12">
            <div className="grid lg:grid-cols-[180px_1fr] gap-8 md:gap-12 items-start">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="pt-3"
              >
                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.22em] text-black/55">
                  <span className="w-2 h-2 bg-[#BFFF07]" />
                  <span>Blogs</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="max-w-[1080px]"
              >
                <h1 className="text-[3.2rem] sm:text-[4.8rem] md:text-[5.8rem] lg:text-[6.2rem] font-medium leading-[0.9] tracking-tighter uppercase text-[#171717]">
                  Insights Into The
                  <br />
                  Driving The Future Of
                  <br />
                  Global Logistics.
                </h1>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="pb-20 md:pb-28">
          <div className="max-w-[1800px] mx-auto px-5 md:px-6 lg:px-12">
            <div className="flex flex-wrap gap-2 md:gap-3 pb-6 md:pb-8">
              {categories.map((category) => {
                const isActive = activeCategory === category;

                return (
                  <motion.button
                    key={category}
                    layout
                    onClick={() => setActiveCategory(category)}
                    className={`px-4 py-2 text-[11px] font-medium transition-colors ${
                      isActive
                        ? "bg-black text-white"
                        : "bg-[#ecece6] text-black/55 hover:bg-black hover:text-white"
                    }`}
                  >
                    {category}
                  </motion.button>
                );
              })}
            </div>

            <div className="h-px bg-black/10 mb-8 md:mb-10" />

            <motion.div layout className="grid md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4 lg:gap-5">
              <AnimatePresence mode="popLayout">
                {filteredArticles.map((article, index) => (
                  <motion.article
                    key={article.slug}
                    layout
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.4, delay: index * 0.04 }}
                    whileHover={{ y: -4 }}
                    className="group"
                  >
                    <Link href={`/blog/${article.slug}`} className="block">
                      <div className="relative aspect-[1.25/0.88] overflow-hidden bg-[#dfdfd8]">
                        <Image
                          src={article.image}
                          alt={article.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />

                        <div className="absolute top-3 left-3 px-3 py-1 bg-black/30 backdrop-blur-sm text-[9px] font-bold uppercase tracking-[0.14em] text-white">
                          {article.category}
                        </div>

                        <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-white/90" />
                      </div>

                      <div className="pt-4 md:pt-5 space-y-3">
                        <h2 className="text-[1.65rem] md:text-[1.9rem] font-medium leading-[1.02] tracking-tight text-[#202020] group-hover:text-black transition-colors">
                          {article.title}
                        </h2>

                        <p className="text-[14px] md:text-[15px] leading-[1.7] text-black/45 max-w-[95%]">
                          {article.excerpt}
                        </p>

                        <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 group-hover:text-black transition-colors">
                          Read article
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </Link>
                  </motion.article>
                ))}
              </AnimatePresence>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
