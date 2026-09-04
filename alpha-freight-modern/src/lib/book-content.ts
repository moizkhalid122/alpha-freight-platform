export type FeaturedBook = {
  slug: string;
  title: string;
  author: string;
  credit: string;
  quote: string;
  quoteSource: string;
  image: string;
  purchaseUrl: string;
  insightSlug?: string;
  paragraphs: string[];
};

export const featuredBooks: FeaturedBook[] = [
  {
    slug: "ninety-percent-of-everything",
    title: "Ninety Percent of Everything",
    author: "Rose George",
    credit: "Author of The Big Necessity",
    quote: "Mind-blowing.",
    quoteSource: "The Atlantic",
    image: "/images/home/book-ninety-percent-of-everything.png",
    purchaseUrl:
      "https://www.amazon.co.uk/Ninety-Percent-Everything-Invisible-published/dp/B00XX6LCN2/ref=sr_1_2?crid=3BSMWGLDZLHOX&dib=eyJ2IjoiMSJ9._bXCUXWLEvJi5iEqtM2SfJR1AHEoumynfhyokjHkSOmO6YtRtZAHoppIoE8rvbJY.Ux6VMzBvnx7m-EV5r5_isxgpvvd1Axn8kKRUKV96Wp0&dib_tag=se&keywords=Ninety+Percent+of+Everything&qid=1788448814&s=books&sprefix=ninety+percent+of+everything%2Cstripbooks%2C265&sr=1-2",
    insightSlug: "transparency-standard-freight",
    paragraphs: [
      "Freight is the invisible engine behind every shelf, factory, and delivery window. Rose George goes inside container ships, ports, and the people who keep global trade moving — most of it unseen by the businesses that depend on it.",
      "For carriers, suppliers, and operators on Alpha Freight, this book reframes what we do: not just moving boxes, but holding together supply chains the world rarely notices until something breaks.",
      "If you want to understand why transparency, live tracking, and verified partners matter in UK haulage, start here.",
    ],
  },
  {
    slug: "the-box",
    title: "The Box",
    author: "Marc Levinson",
    credit: "How the Shipping Container Made the World Smaller",
    quote: "A classic of its kind.",
    quoteSource: "Financial Times",
    image: "/images/home/book-ninety-percent-of-everything.png",
    purchaseUrl: "https://www.amazon.co.uk/Box-Shipping-Container-Smaller-Economy/dp/0691170819",
    insightSlug: "digital-pod-momentum",
    paragraphs: [
      "One invention reshaped global freight forever. Levinson tells the story of the shipping container — and how a single standard unlocked scale, speed, and a new world economy.",
      "Digital freight platforms are the next container moment: less friction, more visibility, and networks that move faster when everyone works from the same system.",
      "Alpha Freight is built for that shift in UK haulage — publish once, match faster, track through delivery.",
    ],
  },
];

/** Current featured book — rotate weekly by index or swap slug here. */
export function getFeaturedBookOfWeek(): FeaturedBook {
  return featuredBooks[0];
}

export function getBookBySlug(slug: string): FeaturedBook | undefined {
  return featuredBooks.find((book) => book.slug === slug);
}
