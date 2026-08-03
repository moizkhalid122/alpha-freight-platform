import { fetchWithTimeout, WEATHER_FETCH_TIMEOUT_MS } from "@/lib/copilot/fetch-utils";

const UK_CITIES: Record<string, { lat: number; lon: number; label: string }> = {
  london: { lat: 51.5074, lon: -0.1278, label: "London" },
  manchester: { lat: 53.4808, lon: -2.2426, label: "Manchester" },
  birmingham: { lat: 52.4862, lon: -1.8904, label: "Birmingham" },
  leeds: { lat: 53.8008, lon: -1.5491, label: "Leeds" },
  glasgow: { lat: 55.8642, lon: -4.2518, label: "Glasgow" },
  liverpool: { lat: 53.4084, lon: -2.9916, label: "Liverpool" },
  bristol: { lat: 51.4545, lon: -2.5879, label: "Bristol" },
  sheffield: { lat: 53.3811, lon: -1.4701, label: "Sheffield" },
  edinburgh: { lat: 55.9533, lon: -3.1883, label: "Edinburgh" },
  cardiff: { lat: 51.4816, lon: -3.1791, label: "Cardiff" },
  nottingham: { lat: 52.9548, lon: -1.1581, label: "Nottingham" },
  newcastle: { lat: 54.9783, lon: -1.6178, label: "Newcastle" },
};

const WMO: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  80: "Rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  95: "Thunderstorm",
};

export type LiveWeatherResult = {
  ok: boolean;
  city: string;
  summary: string;
  markdown: string;
  error?: string;
};

export function extractWeatherCity(message: string): string {
  const lower = message.toLowerCase();
  for (const [key, coords] of Object.entries(UK_CITIES)) {
    if (lower.includes(key)) return coords.label;
  }
  if (/\buk\b/i.test(lower) || /\bbritain\b/i.test(lower)) return "London";
  return "your area";
}

function extractCity(message: string): { lat: number; lon: number; label: string } | null {
  const lower = message.toLowerCase();
  for (const [key, coords] of Object.entries(UK_CITIES)) {
    if (lower.includes(key)) return coords;
  }
  if (/\buk\b/i.test(lower) || /\bbritain\b/i.test(lower)) {
    return UK_CITIES.london!;
  }
  return null;
}

export function isWeatherQuery(message: string): boolean {
  return /\b(weather|forecast|wather|wheather|rain|temperature|temp)\b/i.test(message);
}

export async function fetchUkWeather(message: string): Promise<LiveWeatherResult> {
  const city = extractCity(message);
  if (!city) {
    return { ok: false, city: "", summary: "", markdown: "", error: "no_city" };
  }

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}` +
      `&current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m` +
      `&timezone=Europe%2FLondon&forecast_days=1`;

    const response = await fetchWithTimeout(url, { headers: { Accept: "application/json" } }, WEATHER_FETCH_TIMEOUT_MS);

    if (!response.ok) {
      return { ok: false, city: city.label, summary: "", markdown: "", error: `http_${response.status}` };
    }

    const data = (await response.json()) as {
      current?: {
        temperature_2m?: number;
        apparent_temperature?: number;
        precipitation?: number;
        weather_code?: number;
        wind_speed_10m?: number;
      };
    };

    const c = data.current;
    if (!c) {
      return { ok: false, city: city.label, summary: "", markdown: "", error: "no_data" };
    }

    const condition = WMO[c.weather_code ?? 0] || "Variable conditions";
    const temp = c.temperature_2m ?? 0;
    const feels = c.apparent_temperature ?? temp;
    const wind = c.wind_speed_10m ?? 0;
    const rain = c.precipitation ?? 0;

    const summary = `${city.label}: ${temp.toFixed(1)}°C, ${condition.toLowerCase()}, wind ${wind.toFixed(0)} km/h`;

    const markdown = `### Quick Answer

Right now in **${city.label}** it's **${temp.toFixed(1)}°C** (${condition.toLowerCase()}) — feels like **${feels.toFixed(1)}°C**, wind **${wind.toFixed(0)} km/h**${rain > 0 ? `, precipitation **${rain} mm**` : ""}.

> [!INFO]
> Live data from Open-Meteo. For official forecasts also check [BBC Weather](https://www.bbc.co.uk/weather) or the [Met Office](https://www.metoffice.gov.uk/).

### For your run

If conditions affect your schedule, factor **extra time, grip, and visibility** before accepting tight delivery windows. I can help with **loads, RPM, or backhaul** on your lane — just ask.`;

    return { ok: true, city: city.label, summary, markdown };
  } catch (error) {
    return {
      ok: false,
      city: city.label,
      summary: "",
      markdown: "",
      error: error instanceof Error ? error.message : "fetch_failed",
    };
  }
}

export function buildWeatherOfflineReply(message: string): {
  message: string;
  structuredMessage: import("@/lib/chat-types").StructuredAssistantReply;
} {
  const place = extractWeatherCity(message);
  const body = `### Quick Answer

Main **Alpha Freight AI** UK freight ke liye hai — live weather ke liye abhi aapke network se weather API reach nahi ho rahi (OpenAI bhi blocked ho sakta hai locally).

**${place}** weather abhi yahan check karein:
- [BBC Weather — ${place}](https://www.bbc.co.uk/weather)
- [Met Office forecast](https://www.metoffice.gov.uk/)

> [!TIP]
> Wet ya windy din par delivery window tight na rakhein — extra buffer rakhein.

### Main help kar sakta hoon
**Loads, RPM, fuel cost, route planning** — jaise *"Find loads London to Manchester"* ya *"Calculate profit £800 for 320 miles"*.

> [!INFO]
> Live AI jawab ke liye **VPN** on karein ya **Vercel production** site use karein — kai local networks OpenAI block karte hain.`;

  return {
    message: body,
    structuredMessage: {
      mode: "logistics_copilot",
      displayStyle: "plain",
      assistantName: "Alpha Freight AI",
      modeLabel: "Offline guide",
      knowledgeSource: "offline_weather",
      confidence: 85,
      title: "",
      shortExplanation: body,
      keyPoints: [],
      recommendation: "",
      nextStep: "",
      suggestedQuestions: ["Find loads in the UK", "What is RPM?", "UK diesel price today"],
      quickActions: [],
      rawText: body,
    },
  };
}

export function buildWeatherToolReply(result: LiveWeatherResult): {
  message: string;
  structuredMessage: import("@/lib/chat-types").StructuredAssistantReply;
} {
  const body = result.markdown || result.summary;

  return {
    message: body,
    structuredMessage: {
      mode: "logistics_copilot",
      displayStyle: "plain",
      assistantName: "Alpha Freight AI",
      modeLabel: "Live Weather",
      knowledgeSource: "live_weather",
      confidence: 94,
      title: "",
      shortExplanation: body,
      keyPoints: [],
      recommendation: "",
      nextStep: "Ask about loads or RPM for your route.",
      suggestedQuestions: ["Find loads in the UK", "What is RPM?", "UK diesel price today"],
      quickActions: [],
      rawText: body,
    },
  };
}
