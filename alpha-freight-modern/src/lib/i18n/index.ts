import { enMessages } from "./en";
import type { MessageTree, UiLanguage } from "./types";

export type { UiLanguage } from "./types";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function deepMergeMessages(base: MessageTree, patch?: MessageTree): MessageTree {
  if (!patch) return base;
  const result: MessageTree = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    const existing = result[key];
    if (isObject(value) && isObject(existing)) {
      result[key] = deepMergeMessages(existing as MessageTree, value as MessageTree);
    } else if (typeof value === "string") {
      result[key] = value;
    }
  }
  return result;
}

export function getPath(tree: MessageTree, path: string): string | undefined {
  const parts = path.split(".");
  let current: unknown = tree;
  for (const part of parts) {
    if (!isObject(current) || typeof current[part] === "undefined") return undefined;
    current = current[part];
  }
  return typeof current === "string" ? current : undefined;
}

export function getUiLanguageFromLocaleId(localeId: string): UiLanguage {
  if (localeId.startsWith("es-")) return "es";
  if (localeId.startsWith("pt-")) return "pt";
  if (localeId === "ur-pk-roman") return "ur_roman";
  if (localeId.startsWith("ur-")) return "ur";
  if (localeId.startsWith("fi-")) return "fi";
  if (localeId.startsWith("de-")) return "de";
  if (localeId.startsWith("fr-")) return "fr";
  if (localeId.startsWith("it-")) return "it";
  if (localeId.startsWith("nl-")) return "nl";
  if (localeId.startsWith("pl-")) return "pl";
  if (localeId.startsWith("tr-")) return "tr";
  if (localeId.startsWith("ar-")) return "ar";
  if (localeId.startsWith("hi-")) return "hi";
  if (localeId.startsWith("zh-")) return "zh";
  if (localeId.startsWith("ja-")) return "ja";
  if (localeId.startsWith("ko-")) return "ko";
  if (localeId.startsWith("sv-")) return "sv";
  if (localeId.startsWith("no-")) return "no";
  if (localeId.startsWith("da-")) return "da";
  if (localeId.startsWith("ro-")) return "ro";
  if (localeId.startsWith("uk-")) return "uk";
  if (localeId.startsWith("ru-")) return "ru";
  return "en";
}

export function isRtlLanguage(lang: UiLanguage): boolean {
  return lang === "ar" || lang === "ur";
}

export function getMessages(lang: UiLanguage): MessageTree {
  return deepMergeMessages(enMessages, localeOverrides[lang]);
}

export function createTranslator(lang: UiLanguage) {
  const messages = getMessages(lang);
  return (key: string) => getPath(messages, key) ?? getPath(enMessages, key) ?? key;
}

export type SiteTranslator = ReturnType<typeof createTranslator>;

const spanishMessages: MessageTree = {
  nav: {
    home: "Inicio",
    whyAlpha: "Por qué Alpha",
    products: "Productos",
    solution: "Solución",
    services: "Servicios",
    pricing: "Precios",
    alphaAi: "Alpha AI",
    about: "Sobre nosotros",
    leadership: "Liderazgo",
    investor: "Inversores",
    blog: "Blog",
    career: "Carreras",
    signUp: "Registrarse",
    contactUs: "Contáctanos",
    viewShortlist: "Ver lista",
  },
  lang: {
    selectTitle: "Seleccionar ubicación e idioma",
    search: "Buscar",
    noMatches: "No se encontraron resultados",
  },
  chat: {
    welcomeTitle: "¿En qué puedo ayudarte?",
    welcomeSubtitle:
      "Soy Alpha Freight AI. Cargas, seguimiento y primeros pasos — normalmente en menos de 2 minutos.",
    featuredTitle: "Buscar cargas disponibles",
    featuredSubtitle: "Más popular · 1 min",
    explore: "Explorar",
    trackShipment: "Rastrear envío",
    postLoad: "Publicar carga",
    freightQuote: "Cotización de flete",
    placeholder: "Pregunta lo que quieras sobre flete…",
    newChatTitle: "¿Iniciar un chat nuevo?",
    newChatBody: "Se borrará la conversación actual.",
    keepChatting: "Seguir chateando",
    startNew: "Nuevo chat",
    error: "Lo sentimos, algo salió mal. Inténtalo de nuevo.",
  },
  home: {
    heroLine1: "Sé el próximo",
    heroDesc:
      "Sueña en grande y avanza rápido con Alpha Freight. El marketplace del Reino Unido para transportistas verificados, seguimiento en vivo y pagos en 7 días.",
    startFree: "Empezar gratis",
    whyWeBuild: "Por qué creamos Alpha Freight",
  },
  footer: {
    solutions: "Soluciones",
    developers: "Desarrolladores",
    resources: "Recursos",
    freeTools: "Herramientas gratis",
    company: "Empresa",
    stayUpdated: "Mantente informado",
    emailPlaceholder: "TU CORREO ELECTRÓNICO",
    copyright: "© 2026 ALPHA FREIGHT SOLUTIONS LIMITED. TODOS LOS DERECHOS RESERVADOS.",
    privacy: "Política de privacidad",
    terms: "Términos de servicio",
    cookies: "Cookies",
  },
};

const portugueseMessages: MessageTree = {
  nav: {
    home: "Início",
    whyAlpha: "Por que Alpha",
    products: "Produtos",
    solution: "Solução",
    services: "Serviços",
    pricing: "Preços",
    alphaAi: "Alpha AI",
    about: "Sobre nós",
    leadership: "Liderança",
    investor: "Investidores",
    blog: "Blog",
    career: "Carreiras",
    signUp: "Cadastrar",
    contactUs: "Fale conosco",
    viewShortlist: "Ver lista",
  },
  lang: {
    selectTitle: "Selecionar local e idioma",
    search: "Pesquisar",
    noMatches: "Nenhum resultado encontrado",
  },
  chat: {
    welcomeTitle: "Como posso ajudar?",
    welcomeSubtitle:
      "Sou a Alpha Freight AI. Cargas, rastreamento e primeiros passos — geralmente em menos de 2 minutos.",
    featuredTitle: "Encontrar cargas disponíveis",
    featuredSubtitle: "Mais popular · 1 min",
    explore: "Explorar",
    trackShipment: "Rastrear envio",
    postLoad: "Publicar carga",
    freightQuote: "Cotação de frete",
    placeholder: "Pergunte qualquer coisa sobre frete…",
    newChatTitle: "Iniciar novo chat?",
    newChatBody: "A conversa atual será apagada.",
    keepChatting: "Continuar conversando",
    startNew: "Novo chat",
    error: "Desculpe, algo deu errado. Tente novamente.",
  },
  home: {
    heroLine1: "Seja o próximo",
    startFree: "Começar grátis",
    whyWeBuild: "Por que criamos a Alpha Freight",
  },
};

const germanMessages: MessageTree = {
  nav: {
    home: "Startseite",
    whyAlpha: "Warum Alpha",
    products: "Produkte",
    solution: "Lösung",
    services: "Dienstleistungen",
    pricing: "Preise",
    about: "Über uns",
    signUp: "Registrieren",
    contactUs: "Kontakt",
    viewShortlist: "Merkliste",
  },
  lang: {
    selectTitle: "Standort & Sprache wählen",
    search: "Suchen",
    noMatches: "Keine Treffer",
  },
  chat: {
    welcomeTitle: "Wobei kann ich helfen?",
    placeholder: "Fragen Sie alles über Fracht…",
    startNew: "Neuer Chat",
    keepChatting: "Weiter chatten",
  },
  home: { startFree: "Kostenlos starten" },
};

const frenchMessages: MessageTree = {
  nav: {
    home: "Accueil",
    whyAlpha: "Pourquoi Alpha",
    products: "Produits",
    solution: "Solution",
    services: "Services",
    pricing: "Tarifs",
    about: "À propos",
    signUp: "S'inscrire",
    contactUs: "Nous contacter",
    viewShortlist: "Liste",
  },
  lang: {
    selectTitle: "Choisir lieu et langue",
    search: "Rechercher",
    noMatches: "Aucun résultat",
  },
  chat: { welcomeTitle: "Comment puis-je vous aider ?", placeholder: "Posez une question sur le fret…" },
  home: { startFree: "Commencer gratuitement" },
};

const italianMessages: MessageTree = {
  nav: {
    home: "Home",
    products: "Prodotti",
    solution: "Soluzione",
    pricing: "Prezzi",
    signUp: "Registrati",
    contactUs: "Contattaci",
    viewShortlist: "Lista",
  },
  lang: { selectTitle: "Seleziona luogo e lingua", search: "Cerca", noMatches: "Nessun risultato" },
};

const dutchMessages: MessageTree = {
  nav: {
    home: "Home",
    products: "Producten",
    solution: "Oplossing",
    pricing: "Prijzen",
    signUp: "Aanmelden",
    contactUs: "Contact",
    viewShortlist: "Lijst",
  },
  lang: { selectTitle: "Locatie en taal kiezen", search: "Zoeken", noMatches: "Geen resultaten" },
};

const polishMessages: MessageTree = {
  nav: {
    home: "Strona główna",
    products: "Produkty",
    pricing: "Cennik",
    signUp: "Zarejestruj się",
    contactUs: "Kontakt",
    viewShortlist: "Lista",
  },
  lang: { selectTitle: "Wybierz lokalizację i język", search: "Szukaj", noMatches: "Brak wyników" },
};

const turkishMessages: MessageTree = {
  nav: {
    home: "Ana sayfa",
    products: "Ürünler",
    pricing: "Fiyatlandırma",
    signUp: "Kaydol",
    contactUs: "Bize ulaşın",
    viewShortlist: "Liste",
  },
  lang: { selectTitle: "Konum ve dil seçin", search: "Ara", noMatches: "Sonuç bulunamadı" },
};

const arabicMessages: MessageTree = {
  nav: {
    home: "الرئيسية",
    whyAlpha: "لماذا Alpha",
    products: "المنتجات",
    solution: "الحلول",
    services: "الخدمات",
    pricing: "الأسعار",
    about: "من نحن",
    signUp: "إنشاء حساب",
    contactUs: "اتصل بنا",
    viewShortlist: "القائمة",
  },
  lang: { selectTitle: "اختر الموقع واللغة", search: "بحث", noMatches: "لا توجد نتائج" },
  chat: { welcomeTitle: "كيف يمكنني مساعدتك؟", placeholder: "اسأل أي شيء عن الشحن…" },
  home: { startFree: "ابدأ مجانًا" },
};

const hindiMessages: MessageTree = {
  nav: {
    home: "होम",
    products: "उत्पाद",
    solution: "समाधान",
    pricing: "मूल्य",
    signUp: "साइन अप",
    contactUs: "संपर्क करें",
    viewShortlist: "शॉर्टलिस्ट",
  },
  lang: { selectTitle: "स्थान और भाषा चुनें", search: "खोजें", noMatches: "कोई परिणाम नहीं" },
};

const chineseMessages: MessageTree = {
  nav: {
    home: "首页",
    products: "产品",
    solution: "解决方案",
    pricing: "定价",
    signUp: "注册",
    contactUs: "联系我们",
    viewShortlist: "收藏",
  },
  lang: { selectTitle: "选择地区与语言", search: "搜索", noMatches: "未找到结果" },
  chat: { welcomeTitle: "我能帮您什么？" },
};

const japaneseMessages: MessageTree = {
  nav: {
    home: "ホーム",
    products: "製品",
    pricing: "料金",
    signUp: "登録",
    contactUs: "お問い合わせ",
    viewShortlist: "リスト",
  },
  lang: { selectTitle: "地域と言語を選択", search: "検索", noMatches: "結果がありません" },
};

const koreanMessages: MessageTree = {
  nav: {
    home: "홈",
    products: "제품",
    pricing: "요금",
    signUp: "가입",
    contactUs: "문의하기",
    viewShortlist: "목록",
  },
  lang: { selectTitle: "지역 및 언어 선택", search: "검색", noMatches: "결과 없음" },
};

const swedishMessages: MessageTree = {
  nav: { home: "Hem", products: "Produkter", pricing: "Priser", signUp: "Registrera", contactUs: "Kontakt", viewShortlist: "Lista" },
  lang: { selectTitle: "Välj plats och språk", search: "Sök", noMatches: "Inga träffar" },
};

const norwegianMessages: MessageTree = {
  nav: { home: "Hjem", products: "Produkter", pricing: "Priser", signUp: "Registrer", contactUs: "Kontakt", viewShortlist: "Liste" },
  lang: { selectTitle: "Velg sted og språk", search: "Søk", noMatches: "Ingen treff" },
};

const danishMessages: MessageTree = {
  nav: { home: "Hjem", products: "Produkter", pricing: "Priser", signUp: "Tilmeld", contactUs: "Kontakt", viewShortlist: "Liste" },
  lang: { selectTitle: "Vælg placering og sprog", search: "Søg", noMatches: "Ingen resultater" },
};

const romanianMessages: MessageTree = {
  nav: { home: "Acasă", products: "Produse", pricing: "Prețuri", signUp: "Înregistrare", contactUs: "Contact", viewShortlist: "Listă" },
  lang: { selectTitle: "Selectează locația și limba", search: "Căutare", noMatches: "Niciun rezultat" },
};

const ukrainianMessages: MessageTree = {
  nav: { home: "Головна", products: "Продукти", pricing: "Ціни", signUp: "Реєстрація", contactUs: "Контакт", viewShortlist: "Список" },
  lang: { selectTitle: "Оберіть регіон і мову", search: "Пошук", noMatches: "Нічого не знайдено" },
};

const russianMessages: MessageTree = {
  nav: { home: "Главная", products: "Продукты", pricing: "Цены", signUp: "Регистрация", contactUs: "Связаться", viewShortlist: "Список" },
  lang: { selectTitle: "Выберите регион и язык", search: "Поиск", noMatches: "Ничего не найдено" },
};

const urduMessages: MessageTree = {
  nav: {
    home: "ہوم",
    whyAlpha: "الفا کیوں",
    products: "پروڈکٹس",
    solution: "حل",
    services: "خدمات",
    pricing: "قیمتیں",
    alphaAi: "الفا AI",
    about: "ہمارے بارے میں",
    leadership: "قیادت",
    investor: "سرمایہ کار",
    blog: "بلاگ",
    career: "کیریئر",
    signUp: "سائن اپ",
    contactUs: "رابطہ کریں",
    viewShortlist: "شارٹ لسٹ",
  },
  lang: { selectTitle: "مقام اور زبان منتخب کریں", search: "تلاش", noMatches: "کوئی نتیجہ نہیں" },
  chat: {
    welcomeTitle: "میں آپ کی کیا مدد کر سکتا ہوں؟",
    welcomeSubtitle: "میں Alpha Freight AI ہوں۔ لوڈز، ٹریکنگ اور شروعات — عام طور پر 2 منٹ سے کم۔",
    featuredTitle: "دستیاب لوڈز تلاش کریں",
    explore: "دریافت کریں",
    trackShipment: "شipment ٹریک کریں",
    postLoad: "لوڈ پوسٹ کریں",
    freightQuote: "فریght کوٹ",
    placeholder: "فریght کے بارے میں کچھ بھی پوچھیں…",
    keepChatting: "بات جاری رکھیں",
    startNew: "نیا چیٹ",
  },
  home: {
    heroLine1: "اگلا بنیں",
    heroDesc: "Alpha Freight پر بڑا سوچیں اور تیزی سے آگے بڑھیں۔ تصدیق شدہ کیریئرز، لائیو ٹریکنگ اور 7 دن میں ادائیگی۔",
    startFree: "مفت شروع کریں",
    whyWeBuild: "ہم Alpha Freight کیوں بنا رہے ہیں",
  },
  footer: {
    solutions: "حل",
    developers: "ڈevelپرز",
    resources: "وسائل",
    freeTools: "مفت ٹولز",
    company: "کmpنی",
    copyright: "© 2026 ALPHA FREIGHT SOLUTIONS LIMITED. جملہ حقوق محفوظ ہیں۔",
    privacy: "رازداری کی پالیسی",
    terms: "سروس کی شرائط",
  },
};

const urduRomanMessages: MessageTree = {
  nav: {
    home: "Home",
    whyAlpha: "Alpha Kyun",
    products: "Products",
    solution: "Hal",
    services: "Khidmaat",
    pricing: "Qeematain",
    alphaAi: "Alpha AI",
    about: "Hamare Baare Mein",
    leadership: "Qiyadat",
    investor: "Sarmaya Kaar",
    blog: "Blog",
    career: "Career",
    signUp: "Sign up",
    contactUs: "Rabta Karein",
    viewShortlist: "Shortlist",
  },
  lang: { selectTitle: "Maqam aur zaban select karein", search: "Talash", noMatches: "Koi result nahi" },
  chat: {
    welcomeTitle: "Main aap ki kya madad kar sakta hoon?",
    welcomeSubtitle: "Main Alpha Freight AI hoon. Loads, tracking aur shuruat — aksar 2 minute se kam.",
    featuredTitle: "Dastiyab loads dhoondein",
    explore: "Explore",
    trackShipment: "Shipment track karein",
    postLoad: "Load post karein",
    freightQuote: "Freight quote",
    placeholder: "Freight ke baare mein kuch bhi poochein…",
  },
  home: {
    heroLine1: "Agla banein",
    startFree: "Muft shuru karein",
    whyWeBuild: "Hum Alpha Freight kyun bana rahe hain",
  },
};

const finnishMessages: MessageTree = {
  nav: {
    home: "Etusivu",
    whyAlpha: "Miksi Alpha",
    products: "Tuotteet",
    solution: "Ratkaisu",
    services: "Palvelut",
    pricing: "Hinnoittelu",
    about: "Meistä",
    signUp: "Rekisteröidy",
    contactUs: "Ota yhteyttä",
    viewShortlist: "Lista",
  },
  lang: { selectTitle: "Valitse sijainti ja kieli", search: "Hae", noMatches: "Ei tuloksia" },
  chat: {
    welcomeTitle: "Miten voin auttaa?",
    welcomeSubtitle: "Olen Alpha Freight AI. Kuormat, seuranta ja aloitus — yleensä alle 2 minuutissa.",
    placeholder: "Kysy mitä tahansa rahtiliikenteestä…",
  },
  home: { startFree: "Aloita ilmaiseksi" },
};

const localeOverrides: Partial<Record<UiLanguage, MessageTree>> = {
  es: spanishMessages,
  pt: portugueseMessages,
  de: germanMessages,
  fr: frenchMessages,
  it: italianMessages,
  nl: dutchMessages,
  pl: polishMessages,
  tr: turkishMessages,
  ar: arabicMessages,
  hi: hindiMessages,
  zh: chineseMessages,
  ja: japaneseMessages,
  ko: koreanMessages,
  sv: swedishMessages,
  no: norwegianMessages,
  da: danishMessages,
  ro: romanianMessages,
  uk: ukrainianMessages,
  ru: russianMessages,
  ur: urduMessages,
  ur_roman: urduRomanMessages,
  fi: finnishMessages,
};
