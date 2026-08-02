"use client";

import { Mic, MicOff } from "lucide-react";
import { useVoiceInput } from "@/hooks/useVoiceInput";

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export default function VoiceInputButton({ onTranscript, disabled }: VoiceInputButtonProps) {
  const { isListening, supported, toggle } = useVoiceInput(onTranscript);

  if (!supported) return null;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={toggle}
      aria-label={isListening ? "Stop listening" : "Voice input"}
      title={isListening ? "Listening… click to stop" : "Speak your question"}
      className={`rounded-md p-1.5 transition disabled:opacity-40 ${
        isListening
          ? "bg-red-100 text-red-600 animate-pulse"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
      }`}
    >
      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </button>
  );
}
