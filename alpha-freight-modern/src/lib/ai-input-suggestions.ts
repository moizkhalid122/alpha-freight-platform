export type InputSuggestion = {
  label: string;
  value: string;
};

const SUGGESTIONS: InputSuggestion[] = [
  { label: "Find Loads", value: "How do I find loads in the UK?" },
  { label: "Find Fuel Price", value: "UK diesel price today" },
  { label: "Find Carrier", value: "How do I find a carrier on Alpha Freight?" },
  { label: "Find Backhaul", value: "How do I find backhaul loads?" },
  { label: "Calculate RPM", value: "What is RPM in haulage?" },
  { label: "Calculate Profit", value: "Calculate profit £800 for 320 miles" },
  { label: "Post a Load", value: "How do I post a load as a supplier?" },
  { label: "POD Guide", value: "How does digital POD work?" },
];

export function matchInputSuggestions(input: string): InputSuggestion[] {
  const q = input.trim().toLowerCase();
  if (q.length < 2) return [];

  return SUGGESTIONS.filter(
    (s) =>
      s.label.toLowerCase().includes(q) ||
      s.label.toLowerCase().startsWith(q) ||
      s.value.toLowerCase().includes(q)
  ).slice(0, 5);
}

export function isFuelChartQuery(text: string): boolean {
  return /\b(fuel|diesel|petrol|fuel cost|diesel price|fuel price|fuel surcharge)\b/i.test(text);
}

export function isRpmCalculatorQuery(text: string): boolean {
  return /\b(rpm|revenue per mile|rate per mile|calculate profit|profit calc|margin calc|£\s?\d+\s*(for|over|across)\s*\d+\s*miles?)\b/i.test(
    text
  );
}
