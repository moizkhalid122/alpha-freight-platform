export const officialPublicWarningTitle =
  "OFFICIAL PUBLIC WARNING – ALPHA FREIGHT SOLUTIONS LIMITED";

export const officialWarningIssuer = {
  name: "Khalid Mehmood",
  role: "Chief Executive Officer & 100% shareholder",
};

/** Meta description & schema — plain-language summary for search engines. */
export const officialPublicWarningSeoDescription =
  "Official public warning from Khalid Mehmood, CEO and 100% shareholder of Alpha Freight Solutions Limited — unauthorised company control, ownership dispute, and advice not to book or contract with current management. Read the full statement.";

export type OfficialWarningBlock =
  | { type: "paragraph"; text: string }
  | { type: "emphasis"; text: string };

export const officialPublicWarningBlocks: OfficialWarningBlock[] = [
  {
    type: "paragraph",
    text: "I am issuing this serious public warning to all businesses, customers, suppliers, carriers and anyone considering using or working with Alpha Freight Solutions Limited.",
  },
  {
    type: "emphasis",
    text: "I, Khalid Mehmood, was the CEO and 100% shareholder of Alpha Freight Solutions Limited. I owned this company and personally invested my time, effort and hard work into building it. Alastair James Massey was appointed as a director, not the owner of my company.",
  },
  {
    type: "paragraph",
    text: "I never resigned as CEO or director, never authorised the transfer of my shares and never gave permission for anyone to take control of my company.",
  },
  {
    type: "paragraph",
    text: "I believe I was the victim of serious fraud involving unauthorised changes to the company's ownership, directorship and control. I have formally disputed these changes and reported the matter to the appropriate authorities.",
  },
  {
    type: "emphasis",
    text: "Think about this carefully: if the person who built and owned this company disputes how control was taken away from him, what confidence can any customer, supplier or business partner have in dealing with its current management?",
  },
  {
    type: "emphasis",
    text: "MY STRICT WARNING: DO NOT USE ALPHA FREIGHT SOLUTIONS LIMITED. DO NOT BOOK THROUGH IT, DO NOT GIVE IT YOUR BUSINESS, DO NOT ENTER INTO CONTRACTS OR COMMERCIAL ARRANGEMENTS WITH IT, AND DO NOT PLACE YOUR TRUST IN ITS CURRENT MANAGEMENT.",
  },
  {
    type: "paragraph",
    text: "I do not endorse, support or recommend this company's current management or control.",
  },
  {
    type: "paragraph",
    text: "I am speaking out because I do not want anyone else to face serious business or financial problems similar to what I say I have experienced.",
  },
  {
    type: "emphasis",
    text: "STAY AWAY FROM ALPHA FREIGHT SOLUTIONS LIMITED. I STRONGLY ADVISE EVERYONE NOT TO ENGAGE WITH THIS COMPANY.",
  },
  {
    type: "emphasis",
    text: "THIS IS A SERIOUS PUBLIC WARNING. PLEASE DO NOT IGNORE IT.",
  },
];

export const alastairMasseyWarningImage = {
  src: "/leadership/commercial-director.jpg",
  alt: "Alastair James Massey — named in this public warning",
  name: "Alastair James Massey",
};