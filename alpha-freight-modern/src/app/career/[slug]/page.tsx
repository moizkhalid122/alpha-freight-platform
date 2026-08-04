import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Clock3, MapPin } from "lucide-react";

import Navbar from "@/components/Navbar";
import { CinematicCTA, Footer } from "@/components/Footer";
import CareerApplicationForm from "@/components/careers/CareerApplicationForm";
import { careerOpenings, getCareerOpening, getRelatedOpenings } from "@/lib/careers-content";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return [
    ...careerOpenings.map((opening) => ({ slug: opening.slug })),
    { slug: "general-application" },
  ];
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const opening = getCareerOpening(slug);

  if (!opening) {
    return { title: "Role Not Found | Alpha Freight Careers" };
  }

  return {
    title: `${opening.title} | Alpha Freight Careers`,
    description: opening.summary,
  };
}

export default async function CareerRolePage({ params }: PageProps) {
  const { slug } = await params;
  const opening = getCareerOpening(slug);

  if (!opening) {
    notFound();
  }

  const related = getRelatedOpenings(slug);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f5f5f2] text-black selection:bg-[#BFFF07] selection:text-black">
      <Navbar variant="dark" />

      <main className="pt-28 md:pt-32">
        <section className="relative overflow-hidden border-b border-black/5 pb-14 md:pb-20">
          <div className="absolute inset-0">
            <Image src={opening.image} alt="" fill className="object-cover opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#f5f5f2] via-[#f5f5f2]/95 to-[#f5f5f2]" />
          </div>

          <div className="relative mx-auto max-w-[1200px] px-5 md:px-6 lg:px-12">
            <Link
              href="/career#open-roles"
              className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-black/45 transition-colors hover:text-black"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to careers
            </Link>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-black px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                {opening.team}
              </span>
              <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-black/45">
                {opening.type}
              </span>
              <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-black/45">
                {opening.experience}
              </span>
            </div>

            <h1 className="mt-6 max-w-4xl text-[2.8rem] font-medium leading-[0.95] tracking-tighter sm:text-[4rem] md:text-[4.8rem]">
              {opening.title}
            </h1>

            <p className="mt-6 max-w-3xl text-[17px] leading-relaxed text-black/55 md:text-[19px]">
              {opening.summary}
            </p>

            <div className="mt-8 flex flex-wrap gap-5 text-sm text-black/50">
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {opening.location}
              </span>
              <span className="inline-flex items-center gap-2">
                <BriefcaseBusiness className="h-4 w-4" />
                {opening.salary}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4" />
                Hiring now
              </span>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#apply"
                className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#BFFF07] hover:text-black"
              >
                Apply now
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/career"
                className="inline-flex items-center gap-2 rounded-full border border-black/15 px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.2em] text-black/55 transition-colors hover:text-black"
              >
                All roles
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="mx-auto grid max-w-[1200px] gap-10 px-5 md:px-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-14 lg:px-12">
            <article className="space-y-12">
              <div className="rounded-[2rem] border border-black/10 bg-white p-8 md:p-10">
                <h2 className="text-2xl font-medium tracking-tight">About the role</h2>
                <p className="mt-4 text-[16px] leading-[1.85] text-black/55">{opening.about}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {opening.highlights.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-black/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-black/45"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-black/10 bg-white p-8 md:p-10">
                <h2 className="text-2xl font-medium tracking-tight">What you&apos;ll do</h2>
                <ul className="mt-6 space-y-4">
                  {opening.responsibilities.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-[15px] leading-relaxed text-black/55">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#BFFF07]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-[2rem] border border-black/10 bg-white p-8">
                  <h2 className="text-xl font-medium tracking-tight">Requirements</h2>
                  <ul className="mt-5 space-y-3">
                    {opening.requirements.map((item) => (
                      <li key={item} className="text-sm leading-relaxed text-black/55">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-[2rem] border border-black/10 bg-[#f7f7f4] p-8">
                  <h2 className="text-xl font-medium tracking-tight">Nice to have</h2>
                  <ul className="mt-5 space-y-3">
                    {opening.niceToHave.map((item) => (
                      <li key={item} className="text-sm leading-relaxed text-black/55">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>

            <aside className="lg:sticky lg:top-32 lg:self-start">
              <CareerApplicationForm roleTitle={opening.title} roleSlug={opening.slug} />
            </aside>
          </div>
        </section>

        <section className="border-t border-black/5 bg-white py-16 md:py-24">
          <div className="mx-auto max-w-[1200px] px-5 md:px-6 lg:px-12">
            <div className="mb-8 flex items-end justify-between gap-6">
              <h2 className="text-3xl font-medium tracking-tight md:text-4xl">Related roles</h2>
              <Link
                href="/career#open-roles"
                className="text-[11px] font-bold uppercase tracking-[0.2em] text-black/45 transition-colors hover:text-black"
              >
                View all
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {related.map((role) => (
                <Link
                  key={role.slug}
                  href={`/career/${role.slug}`}
                  className="group rounded-[1.75rem] border border-black/10 bg-[#f7f7f4] p-6 transition-transform duration-300 hover:-translate-y-1"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/35">{role.team}</p>
                  <h3 className="mt-3 text-xl font-medium tracking-tight group-hover:text-black">{role.title}</h3>
                  <p className="mt-3 text-sm text-black/50">{role.location}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <CinematicCTA
        title="Ready to join Alpha Freight?"
        subtitle="Build with us"
        buttonText="Explore Careers"
        buttonHref="/career"
      />
      <Footer />
    </div>
  );
}
