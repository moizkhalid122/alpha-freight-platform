import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Platform } from "react-native";
import { requireOptionalNativeModule } from "expo-modules-core";

type SpeechModule = {
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
  start: (options: {
    lang: string;
    interimResults: boolean;
    continuous: boolean;
  }) => void;
  stop: () => void;
  addListener: (
    eventName: string,
    listener: (event: unknown) => void
  ) => { remove: () => void };
};

type ResultEvent = {
  isFinal?: boolean;
  results?: Array<{ transcript?: string }>;
};

type ErrorEvent = {
  error?: string;
};

type UseAiVoiceInputOptions = {
  onFinalTranscript: (text: string) => void;
  language?: string;
};

const REBUILD_HINT =
  Platform.OS === "ios"
    ? "Voice ke liye dev client dubara build karo:\n\nnpx expo run:ios"
    : "Voice ke liye dev client dubara build karo:\n\nnpx expo run:android";

function getSpeechModule() {
  return requireOptionalNativeModule<SpeechModule>("ExpoSpeechRecognition");
}

export function useAiVoiceInput({
  onFinalTranscript,
  language = "en-GB",
}: UseAiVoiceInputOptions) {
  const speechModuleRef = useRef(getSpeechModule());
  const onFinalTranscriptRef = useRef(onFinalTranscript);
  const [isListening, setIsListening] = useState(false);
  const [partialText, setPartialText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isAvailable = speechModuleRef.current != null;

  onFinalTranscriptRef.current = onFinalTranscript;

  useEffect(() => {
    const module = speechModuleRef.current;
    if (!module) return;

    const subscriptions = [
      module.addListener("start", () => {
        setIsListening(true);
        setErrorMessage(null);
      }),
      module.addListener("end", () => {
        setIsListening(false);
        setPartialText("");
      }),
      module.addListener("result", (rawEvent) => {
        const event = rawEvent as ResultEvent;
        const transcript = event.results?.[0]?.transcript?.trim() || "";
        if (!transcript) return;

        setPartialText(transcript);

        if (event.isFinal) {
          onFinalTranscriptRef.current(transcript);
          setPartialText("");
          setIsListening(false);
        }
      }),
      module.addListener("error", (rawEvent) => {
        const event = rawEvent as ErrorEvent;
        setIsListening(false);
        setPartialText("");
        setErrorMessage(event.error || "Voice input failed");
      }),
    ];

    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
    };
  }, []);

  const stopListening = useCallback(() => {
    speechModuleRef.current?.stop();
    setIsListening(false);
    setPartialText("");
  }, []);

  const startListening = useCallback(async () => {
    const module = speechModuleRef.current;
    if (!module) {
      Alert.alert("Voice input", REBUILD_HINT);
      return;
    }

    setErrorMessage(null);

    const permission = await module.requestPermissionsAsync();
    if (!permission.granted) {
      setErrorMessage("Microphone permission is required for voice input.");
      return;
    }

    setPartialText("");
    setIsListening(true);

    module.start({
      lang: language,
      interimResults: true,
      continuous: false,
    });
  }, [language]);

  const toggleListening = useCallback(async () => {
    if (!speechModuleRef.current) {
      Alert.alert("Voice input", REBUILD_HINT);
      return;
    }

    if (isListening) {
      stopListening();
      return;
    }

    await startListening();
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    partialText,
    errorMessage,
    isAvailable,
    toggleListening,
    stopListening,
  };
}
