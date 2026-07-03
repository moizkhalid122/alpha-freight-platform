"use client";

import Image from "next/image";

const showcaseImages = [
  {
    src: "/demo%201.jpeg",
    alt: "Demo preview 1",
    className: "",
  },
  {
    src: "/demo%202.jpeg",
    alt: "Demo preview 2",
    className: "",
  },
  {
    src: "/demo%203.jpeg",
    alt: "Demo preview 3",
    className: "",
  },
  {
    src: "/demo%204.jpeg",
    alt: "Demo preview 4",
    className: "",
  },
  {
    src: "/demo%205.jpeg",
    alt: "Demo preview 5",
    className: "",
  },
];

const firstColumnImages = [...showcaseImages, ...showcaseImages];
const secondColumnImages = [...showcaseImages.slice().reverse(), ...showcaseImages.slice().reverse()];

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-950">
      <main className="min-h-screen py-0">
        <section className="px-5 lg:min-h-screen lg:pl-8 lg:pr-2">
          <div className="w-full max-w-none">
          <div className="grid gap-6 lg:min-h-screen lg:grid-cols-[minmax(520px,560px)_minmax(0,1fr)] lg:items-stretch">
            <div className="p-5 pt-10 sm:p-6 sm:pt-12 lg:p-8 lg:pt-16">
              <div className="max-w-lg">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-100 bg-slate-50 px-3 py-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Demo Request Form
                  </span>
                </div>

                <h2 className="mb-4 text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl">
                  Tell us what you want <br />
                  <span className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text font-serif font-light italic text-transparent">
                    to see in the session
                  </span>
                </h2>

                <p className="max-w-xl text-base font-medium leading-relaxed text-slate-500">
                  Book a live walkthrough of the platform and see how suppliers, carriers, tracking,
                  and AI assistant workflows fit into one system.
                </p>

                <form className="mt-8 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">Full Name</span>
                      <input
                        type="text"
                        placeholder="Your full name"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-900"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">Company</span>
                      <input
                        type="text"
                        placeholder="Company name"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-900"
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">Work Email</span>
                      <input
                        type="email"
                        placeholder="you@company.com"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-900"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">Phone</span>
                      <input
                        type="tel"
                        placeholder="+44 7..."
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-900"
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">I Am Interested In</span>
                      <select className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-900">
                        <option>Supplier workflows</option>
                        <option>Carrier workflows</option>
                        <option>Tracking and visibility</option>
                        <option>AI Assistant</option>
                        <option>Full platform demo</option>
                      </select>
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-700">Team Size</span>
                      <select className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-900">
                        <option>1-10 people</option>
                        <option>11-50 people</option>
                        <option>51-200 people</option>
                        <option>200+ people</option>
                      </select>
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">What would you like to see in the demo?</span>
                    <textarea
                      rows={4}
                      placeholder="Tell us about your workflows, challenges, or the features you want us to show."
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-900"
                    />
                  </label>

                  <div className="flex flex-col gap-4 pt-3 sm:flex-row sm:items-end sm:justify-between">
                    <p className="max-w-[320px] text-sm leading-6 text-slate-500">
                      We will contact you to schedule a live walkthrough tailored to your business.
                    </p>

                    <button
                      type="submit"
                      className="inline-flex min-h-[60px] min-w-[116px] items-center justify-center self-start rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 sm:self-end"
                    >
                      Request Demo
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="p-4 sm:p-5 lg:flex lg:items-stretch lg:pl-12 lg:pr-0 lg:py-0">
              <div className="relative ml-auto h-[620px] w-full max-w-[760px] overflow-hidden rounded-[1.5rem] lg:h-screen lg:max-w-[760px]">
                <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-20 bg-gradient-to-b from-[#FDFDFD] to-transparent" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20 bg-gradient-to-t from-[#FDFDFD] to-transparent" />

                <div className="grid grid-cols-2 gap-3">
                  <div className="demo-column demo-column-up space-y-3">
                    {firstColumnImages.map((image, index) => (
                      <div
                        key={`${image.src}-up-${index}`}
                        className="group relative h-[138px] overflow-hidden rounded-[1.25rem] border border-white/70 bg-white shadow-sm sm:h-[165px]"
                      >
                        <Image
                          src={image.src}
                          alt={image.alt}
                          fill
                          className="object-cover transition duration-500 group-hover:scale-[1.03]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent" />
                      </div>
                    ))}
                  </div>

                  <div className="demo-column demo-column-down space-y-3">
                    {secondColumnImages.map((image, index) => (
                      <div
                        key={`${image.src}-down-${index}`}
                        className="group relative h-[138px] overflow-hidden rounded-[1.25rem] border border-white/70 bg-white shadow-sm sm:h-[165px]"
                      >
                        <Image
                          src={image.src}
                          alt={image.alt}
                          fill
                          className="object-cover transition duration-500 group-hover:scale-[1.03]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/30 via-transparent to-transparent" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </section>
      </main>

      <style jsx>{`
        .demo-column {
          will-change: transform;
        }

        .demo-column-up {
          animation: demo-slide-up 22s linear infinite;
        }

        .demo-column-down {
          animation: demo-slide-down 22s linear infinite;
        }

        @keyframes demo-slide-up {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(calc(-50% - 6px));
          }
        }

        @keyframes demo-slide-down {
          0% {
            transform: translateY(calc(-50% - 6px));
          }
          100% {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
