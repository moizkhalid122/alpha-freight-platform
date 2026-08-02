export type PodAnalysisResult = {
  complete: boolean;
  score: number;
  checks: Array<{ label: string; passed: boolean; note: string }>;
  missingItems: string[];
  recommendation: string;
};

export function analyzePodText(description: string): PodAnalysisResult {
  const lower = description.toLowerCase();
  const checks = [
    {
      label: "Recipient signature",
      passed: /\b(sign|signed|signature)\b/i.test(lower),
      note: "POD must include recipient signature",
    },
    {
      label: "Delivery date/time",
      passed: /\b(date|time|delivered|delivery)\b/i.test(lower),
      note: "Date and time of delivery required",
    },
    {
      label: "Load reference",
      passed: /\b(load|ref|reference|id|#\d)\b/i.test(lower),
      note: "Load ID or reference number helps match POD",
    },
    {
      label: "Condition notes",
      passed: /\b(good|damaged|short|complete|condition|ok)\b/i.test(lower),
      note: "Note goods condition on delivery",
    },
    {
      label: "Company/site name",
      passed: /\b(ltd|limited|warehouse|depot|site|company)\b/i.test(lower),
      note: "Delivery site or company name recommended",
    },
  ];

  const passed = checks.filter((c) => c.passed).length;
  const score = Math.round((passed / checks.length) * 100);
  const missingItems = checks.filter((c) => !c.passed).map((c) => c.note);

  let recommendation = "";
  if (score >= 80) {
    recommendation = "POD looks complete — upload via the app or supplier portal for fast verification.";
  } else if (score >= 50) {
    recommendation = "POD partially complete — add missing items before uploading to avoid delays.";
  } else {
    recommendation = "POD appears incomplete — ensure signature, date, and load reference are visible.";
  }

  return { complete: score >= 80, score, checks, missingItems, recommendation };
}

export function buildPodHelpReply(analysis?: PodAnalysisResult): {
  title: string;
  shortExplanation: string;
  keyPoints: string[];
  recommendation: string;
} {
  if (!analysis) {
    return {
      title: "📄 Proof of Delivery (POD) Guide",
      shortExplanation:
        "POD is the signed document confirming goods were delivered. It's required for payout release on Alpha Freight.",
      keyPoints: [
        "✍️ Recipient signature — must be visible and legible",
        "📅 Delivery date and time — stamp or written",
        "🔢 Load reference — match to your load ID",
        "📦 Condition — note any damage or shortages",
        "📸 Photo — clear, well-lit image of full document",
      ],
      recommendation: "Upload POD in the app under My Loads → Delivered → Upload POD.",
    };
  }

  return {
    title: analysis.complete ? "✅ POD looks complete" : "⚠️ POD needs attention",
    shortExplanation: `POD completeness score: ${analysis.score}%. ${analysis.recommendation}`,
    keyPoints: analysis.checks.map((c) => `${c.passed ? "✅" : "❌"} ${c.label}: ${c.note}`),
    recommendation: analysis.recommendation,
  };
}
