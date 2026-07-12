import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import LottieView from "lottie-react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { buildChatHistory, sendAiChatMessageStream } from "@/lib/ai-chat-api";
import type { AiAssistantRole, AiQuickAction } from "@/lib/ai-assistant-responses";
import { useAiVoiceInput } from "@/lib/use-ai-voice-input";
import { fetchAiCarrierContext, getCachedAiCarrierContext, isAiCarrierContextStale } from "@/lib/ai-carrier-context";
import { fetchAiSupplierContext } from "@/lib/ai-supplier-context";
import { tryBuildCarrierLocalReply } from "@/lib/ai-carrier-local-reply";
import {
  buildSupplierPaymentReminder,
  enrichSupplierReplyWithActions,
  tryBuildSupplierLocalReply,
} from "@/lib/ai-supplier-local-reply";
import { fetchAiRouteContext, isRouteDistanceQuestion } from "@/lib/ai-route-context";
import { isWebSearchQuestion } from "@/lib/ai-web-search-detect";
import {
  buildDynamicSuggestions,
  buildSupplierDynamicSuggestions,
  deleteAiChatMessage,
  listAiChatConversations,
  loadAiChatConversationMessages,
  saveAiChatAssistantMessage,
  saveAiChatUserMessage,
  type AiChatConversationSummary,
} from "@/lib/ai-chat-history";
import { useKeyboardInset } from "@/lib/use-keyboard-inset";
import { supabase } from "@/lib/supabase";
import { getUserRole } from "@/lib/user-role";
import ChatHistorySheet from "@/components/ai/ChatHistorySheet";
import TypewriterAssistantReply from "@/components/ai/TypewriterAssistantReply";
import { colors, radius, shadow, spacing } from "@/lib/theme";

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  title?: string;
  sectionLabel?: string;
  bullets?: string[];
  footer?: string;
  actions?: AiQuickAction[];
};

const DEFAULT_CARRIER_SUGGESTIONS = [
  "Show me my best available loads",
  "What is my wallet balance?",
  "UK diesel price today?",
];

const DEFAULT_SUPPLIER_SUGGESTIONS = [
  "Help me post a new load",
  "Show my active posted loads",
  "How does pay now vs pay later work?",
];

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function WelcomeHero({ role }: { role: AiAssistantRole }) {
  const isSupplier = role === "supplier";

  return (
    <View style={styles.hero}>
      <View style={styles.heroOrb}>
        <LottieView
          source={require("@/assets/lottie/orb-ai-assistant.json")}
          autoPlay
          loop
          style={styles.heroOrbLottie}
        />
      </View>
      <Text style={styles.heroTitle}>
        {isSupplier ? "Supplier Co-Pilot" : "Alpha Freight Co-Pilot"}
      </Text>
      <Text style={styles.heroSub}>
        {isSupplier
          ? "Your AI for posting loads, carrier bids, payments, and shipment tracking."
          : "Your AI assistant for UK loads, bids, wallet, and deliveries."}
      </Text>
    </View>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <View style={styles.userRow}>
      <View style={styles.userBubble}>
        <Text style={styles.userText}>{text}</Text>
      </View>
    </View>
  );
}

const COMPOSER_MIN_HEIGHT = 54;
const NEAR_BOTTOM_THRESHOLD = 96;

export default function AiAssistantScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const isClosingRef = useRef(false);
  const isNearBottomRef = useRef(true);
  const scrollGesture = useMemo(() => Gesture.Native(), []);
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(0);
  const scrollOffsetY = useSharedValue(0);
  const isClosing = useSharedValue(false);
  const { inset: keyboardInset, isVisible: isKeyboardVisible } = useKeyboardInset();
  const [input, setInput] = useState("");
  const [loadingMode, setLoadingMode] = useState<"thinking" | "searching" | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [showHistorySheet, setShowHistorySheet] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [savedConversations, setSavedConversations] = useState<AiChatConversationSummary[]>([]);
  const [activeConversationTitle, setActiveConversationTitle] = useState<string | null>(null);
  const [assistantType, setAssistantType] = useState<AiAssistantRole>("carrier");
  const [paymentReminder, setPaymentReminder] = useState<ChatMessage | null>(null);
  const [suggestions, setSuggestions] = useState(DEFAULT_CARRIER_SUGGESTIONS);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const submitPromptRef = useRef<(raw: string) => Promise<void>>(async () => {});
  const [composerHeight, setComposerHeight] = useState(COMPOSER_MIN_HEIGHT);
  const [inputFocused, setInputFocused] = useState(false);
  const conversationIdRef = useRef<string | null>(null);
  const carrierContextRef = useRef<Awaited<ReturnType<typeof fetchAiCarrierContext>>>(null);
  const supplierContextRef = useRef<Awaited<ReturnType<typeof fetchAiSupplierContext>>>(null);

  const isBusy = loadingMode !== null || streamingMessageId !== null;
  const hasConversation = messages.length > 0 || isBusy;

  const { isListening, partialText, toggleListening } = useAiVoiceInput({
    onFinalTranscript: (transcript) => {
      setInput("");
      void submitPromptRef.current(transcript);
    },
  });

  const composerValue = isListening && partialText ? partialText : input;
  const showSuggestions = !hasConversation && !inputFocused && !isKeyboardVisible && !isBootstrapping;

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const role = session?.user?.id ? await getUserRole(session.user.id) : "carrier";
      const type: AiAssistantRole = role === "supplier" ? "supplier" : "carrier";

      if (!mounted) return;

      setAssistantType(type);

      if (type === "supplier") {
        const supplierContext = await fetchAiSupplierContext().catch(() => null);
        supplierContextRef.current = supplierContext;
        if (!mounted) return;
        setSuggestions(buildSupplierDynamicSuggestions(supplierContext?.stats ?? null));
        const reminder = buildSupplierPaymentReminder(supplierContext);
        if (reminder) {
          setPaymentReminder({
            id: "payment-reminder",
            role: "assistant",
            text: "",
            title: reminder.title,
            sectionLabel: reminder.sectionLabel,
            bullets: reminder.bullets,
            footer: reminder.footer,
            actions: reminder.actions,
          });
        }
      } else {
        const carrierContext = await fetchAiCarrierContext().catch(() => null);
        carrierContextRef.current = carrierContext ?? getCachedAiCarrierContext();
        if (!mounted) return;
        setSuggestions(buildDynamicSuggestions(carrierContext?.stats ?? null));
      }

      setIsBootstrapping(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const lastAssistantMessageId = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index].role === "assistant") {
        return messages[index].id;
      }
    }
    return null;
  }, [messages]);

  const copilotTitle = assistantType === "supplier" ? "Supplier Co-Pilot" : "Alpha Freight Co-Pilot";

  const requestAssistantReply = useCallback(
    async (
      userText: string,
      historyMessages: ChatMessage[],
      searching: boolean,
      streamHandlers: {
        onPhase: (phase: "thinking" | "searching") => void;
        onDelta: (text: string) => void;
      }
    ) => {
      const history = buildChatHistory(historyMessages);
      const routeContext =
        !searching && isRouteDistanceQuestion(userText)
          ? await fetchAiRouteContext(userText).catch(() => null)
          : null;

      if (assistantType === "supplier") {
        let supplierContext = searching ? null : supplierContextRef.current;
        if (!searching && !supplierContext) {
          supplierContext = await fetchAiSupplierContext().catch(() => null);
        }
        if (supplierContext) supplierContextRef.current = supplierContext;

        const localReply = supplierContext
          ? tryBuildSupplierLocalReply(userText, supplierContext)
          : null;

        if (localReply) {
          return localReply;
        }

        const reply = await sendAiChatMessageStream(userText, {
          assistantType: "supplier",
          history,
          supplierContext,
          routeContext,
          onPhase: streamHandlers.onPhase,
          onDelta: streamHandlers.onDelta,
        });

        return enrichSupplierReplyWithActions(reply, userText, supplierContext);
      }

      let carrierContext = searching ? null : carrierContextRef.current ?? getCachedAiCarrierContext();
      if (!searching && (!carrierContext || isAiCarrierContextStale())) {
        carrierContext = await fetchAiCarrierContext().catch(() => carrierContext);
      }
      if (carrierContext) carrierContextRef.current = carrierContext;

      const localReply = carrierContext ? tryBuildCarrierLocalReply(userText, carrierContext) : null;
      if (localReply) {
        return localReply;
      }

      return sendAiChatMessageStream(userText, {
        assistantType: "carrier",
        history,
        carrierContext,
        routeContext,
        onPhase: streamHandlers.onPhase,
        onDelta: streamHandlers.onDelta,
      });
    },
    [assistantType]
  );

  const scrollToEnd = useCallback((force = false) => {
    if (!force && !isNearBottomRef.current) return;

    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  const markNearBottom = useCallback((nearBottom: boolean) => {
    isNearBottomRef.current = nearBottom;
  }, []);

  useEffect(() => {
    if (isKeyboardVisible && hasConversation) {
      const timer = setTimeout(scrollToEnd, 80);
      return () => clearTimeout(timer);
    }
  }, [isKeyboardVisible, hasConversation, keyboardInset, scrollToEnd]);

  const composerBottomInset = isKeyboardVisible ? keyboardInset : 0;
  const composerPadBottom = isKeyboardVisible
    ? 0
    : Math.max(insets.bottom, spacing.sm);
  const scrollBottomPad =
    composerHeight + composerPadBottom + composerBottomInset + spacing.md;

  const markClosing = useCallback(() => {
    isClosingRef.current = true;
  }, []);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const navigationDismiss = useCallback(() => {
    if (router.canDismiss()) {
      router.dismiss();
      return;
    }

    router.back();
  }, []);

  const dismissSheet = useCallback(() => {
    if (isClosingRef.current) return;

    markClosing();
    isClosing.value = true;
    Keyboard.dismiss();
    translateY.value = withTiming(windowHeight, { duration: 240 }, (finished) => {
      if (finished) runOnJS(navigationDismiss)();
    });
  }, [isClosing, markClosing, navigationDismiss, translateY, windowHeight]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY(12)
        .failOffsetX([-24, 24])
        .simultaneousWithExternalGesture(scrollGesture)
        .onUpdate((event) => {
          const dragAllowed =
            scrollOffsetY.value <= 1 || event.y <= 100 || translateY.value > 0;

          if (dragAllowed && event.translationY > 0) {
            translateY.value = event.translationY;
          }
        })
        .onEnd((event) => {
          if (isClosing.value) return;

          const dragAllowed =
            scrollOffsetY.value <= 1 || event.y <= 100 || translateY.value > 0;

          if (!dragAllowed) {
            translateY.value = withSpring(0, { damping: 22, stiffness: 300 });
            return;
          }

          const shouldDismiss =
            event.translationY > windowHeight * 0.18 || event.velocityY > 750;

          if (shouldDismiss) {
            if (isClosing.value) return;
            isClosing.value = true;
            runOnJS(markClosing)();
            runOnJS(dismissKeyboard)();
            translateY.value = withTiming(windowHeight, { duration: 220 }, (finished) => {
              if (finished) runOnJS(navigationDismiss)();
            });
            return;
          }

          translateY.value = withSpring(0, { damping: 22, stiffness: 300 });
        }),
    [dismissKeyboard, isClosing, markClosing, navigationDismiss, scrollGesture, scrollOffsetY, translateY, windowHeight]
  );

  const sheetStyle = useAnimatedStyle(() => {
    const topRadius = interpolate(translateY.value, [0, 36], [0, 18], Extrapolation.CLAMP);

    return {
      transform: [{ translateY: translateY.value }],
      borderTopLeftRadius: topRadius,
      borderTopRightRadius: topRadius,
      overflow: "hidden",
    };
  });

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollOffsetY.value = event.contentOffset.y;
      const distanceFromBottom =
        event.contentSize.height - event.layoutMeasurement.height - event.contentOffset.y;
      runOnJS(markNearBottom)(distanceFromBottom <= NEAR_BOTTOM_THRESHOLD);
    },
  });

  const submitPrompt = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || isBusy) return;

      Keyboard.dismiss();
      setInput("");

      const userMessage: ChatMessage = {
        id: createId(),
        role: "user",
        text,
      };

      setMessages((current) => [...current, userMessage]);
      const searching = isWebSearchQuestion(text);
      setLoadingMode(searching ? "searching" : "thinking");
      isNearBottomRef.current = true;
      scrollToEnd(true);

      const savePromise = saveAiChatUserMessage(conversationIdRef.current, { text }, assistantType);
      const historyMessages = [...messages, userMessage];
      const streamingId = createId();
      let streamingStarted = false;
      let streamedText = "";

      try {
        const reply = await requestAssistantReply(text, historyMessages, searching, {
          onPhase: (phase) => setLoadingMode(phase),
          onDelta: (delta) => {
            streamedText += delta;

            if (!streamingStarted) {
              streamingStarted = true;
              setLoadingMode(null);
              setStreamingMessageId(streamingId);
              setMessages((current) => [
                ...current,
                {
                  id: streamingId,
                  role: "assistant",
                  text: "",
                  title: copilotTitle,
                  sectionLabel: streamedText,
                },
              ]);
              return;
            }

            setMessages((current) =>
              current.map((message) =>
                message.id === streamingId
                  ? { ...message, sectionLabel: streamedText }
                  : message
              )
            );
            scrollToEnd(true);
          },
        });

        const savedUser = await savePromise;
        if (savedUser.conversationId) {
          setConversationId(savedUser.conversationId);
          setActiveConversationTitle(text.slice(0, 72));
        }

        const assistantMessage: ChatMessage = {
          id: streamingStarted ? streamingId : createId(),
          role: "assistant",
          text: "",
          title: reply.title,
          sectionLabel: reply.sectionLabel,
          bullets: reply.bullets,
          footer: reply.footer,
          actions: reply.actions,
        };

        const savedAssistant = await saveAiChatAssistantMessage(
          savedUser.conversationId || conversationIdRef.current,
          assistantMessage
        );
        if (savedAssistant.messageId) {
          assistantMessage.id = savedAssistant.messageId;
        }

        if (streamingStarted) {
          setMessages((current) =>
            current.map((message) =>
              message.id === streamingId ? assistantMessage : message
            )
          );
        } else {
          setMessages((current) => [...current, assistantMessage]);
        }

        setTypingMessageId(null);
        isNearBottomRef.current = true;
        scrollToEnd(true);
      } finally {
        setLoadingMode(null);
        setStreamingMessageId(null);
      }
    },
    [assistantType, copilotTitle, isBusy, messages, requestAssistantReply, scrollToEnd]
  );

  useEffect(() => {
    submitPromptRef.current = submitPrompt;
  }, [submitPrompt]);

  const handleRegenerate = useCallback(
    async (assistantMessageId: string) => {
      if (isBusy) return;

      const assistantIndex = messages.findIndex((message) => message.id === assistantMessageId);
      if (assistantIndex <= 0) return;

      let userIndex = assistantIndex - 1;
      while (userIndex >= 0 && messages[userIndex].role !== "user") {
        userIndex -= 1;
      }
      if (userIndex < 0) return;

      const userMessage = messages[userIndex];
      const historyBefore = messages.slice(0, userIndex);
      const searching = isWebSearchQuestion(userMessage.text);

      setLoadingMode(searching ? "searching" : "thinking");
      isNearBottomRef.current = true;
      scrollToEnd(true);

      await deleteAiChatMessage(assistantMessageId);
      setMessages((current) => current.filter((message) => message.id !== assistantMessageId));

      const streamingId = createId();
      let streamingStarted = false;
      let streamedText = "";

      try {
        const reply = await requestAssistantReply(userMessage.text, historyBefore, searching, {
          onPhase: (phase) => setLoadingMode(phase),
          onDelta: (delta) => {
            streamedText += delta;

            if (!streamingStarted) {
              streamingStarted = true;
              setLoadingMode(null);
              setStreamingMessageId(streamingId);
              setMessages((current) => [
                ...current,
                {
                  id: streamingId,
                  role: "assistant",
                  text: "",
                  title: copilotTitle,
                  sectionLabel: streamedText,
                },
              ]);
              return;
            }

            setMessages((current) =>
              current.map((message) =>
                message.id === streamingId
                  ? { ...message, sectionLabel: streamedText }
                  : message
              )
            );
            scrollToEnd(true);
          },
        });

        const assistantMessage: ChatMessage = {
          id: streamingStarted ? streamingId : createId(),
          role: "assistant",
          text: "",
          title: reply.title,
          sectionLabel: reply.sectionLabel,
          bullets: reply.bullets,
          footer: reply.footer,
          actions: reply.actions,
        };

        const savedAssistant = await saveAiChatAssistantMessage(
          conversationIdRef.current,
          assistantMessage
        );
        if (savedAssistant.messageId) {
          assistantMessage.id = savedAssistant.messageId;
        }

        if (streamingStarted) {
          setMessages((current) =>
            current.map((message) =>
              message.id === streamingId ? assistantMessage : message
            )
          );
        } else {
          setMessages((current) => [...current, assistantMessage]);
        }

        setTypingMessageId(null);
        isNearBottomRef.current = true;
        scrollToEnd(true);
      } finally {
        setLoadingMode(null);
        setStreamingMessageId(null);
      }
    },
    [isBusy, messages, requestAssistantReply, scrollToEnd]
  );

  const handleNewChat = useCallback(async () => {
    if (isBusy) return;

    setMessages([]);
    setConversationId(null);
    setActiveConversationTitle(null);
    setTypingMessageId(null);
    isNearBottomRef.current = true;

    if (assistantType === "supplier") {
      const supplierContext = await fetchAiSupplierContext().catch(() => null);
      setSuggestions(buildSupplierDynamicSuggestions(supplierContext?.stats ?? null));
    } else {
      const carrierContext = await fetchAiCarrierContext().catch(() => null);
      setSuggestions(buildDynamicSuggestions(carrierContext?.stats ?? null));
    }
  }, [assistantType, isBusy]);

  const handleOpenHistory = useCallback(async () => {
    if (isBusy) return;

    setShowHistorySheet(true);
    setHistoryLoading(true);

    const conversations = await listAiChatConversations(assistantType);
    setSavedConversations(conversations);
    setHistoryLoading(false);
  }, [assistantType, isBusy]);

  const handleSelectConversation = useCallback(
    async (selectedConversationId: string) => {
      setShowHistorySheet(false);
      setHistoryLoading(true);
      setLoadingMode("thinking");

      const [messagesForConversation, conversations] = await Promise.all([
        loadAiChatConversationMessages(selectedConversationId),
        listAiChatConversations(assistantType),
      ]);

      const selectedConversation = conversations.find(
        (conversation) => conversation.id === selectedConversationId
      );

      setSavedConversations(conversations);
      setConversationId(selectedConversationId);
      setActiveConversationTitle(selectedConversation?.title || "Saved chat");
      setMessages(messagesForConversation);
      setTypingMessageId(null);
      setHistoryLoading(false);
      setLoadingMode(null);
      isNearBottomRef.current = true;

      requestAnimationFrame(() => {
        scrollRef.current?.scrollToEnd({ animated: false });
      });
    },
    [assistantType]
  );

  const handleQuickAction = useCallback((action: AiQuickAction) => {
    if (action.route) {
      router.push(action.route as never);
    }
  }, []);

  const handleCopy = useCallback(async (message: ChatMessage) => {
    const copyText = [
      message.title,
      message.sectionLabel,
      ...(message.bullets || []),
      message.footer,
    ]
      .filter(Boolean)
      .join("\n");
    await Clipboard.setStringAsync(copyText);
  }, []);

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.root, sheetStyle]}>
        <SafeAreaView style={styles.safe} edges={["top"]}>
          <View style={styles.header}>
            <View style={styles.dragZone}>
              <View style={styles.grabber} />
            </View>

            <View style={styles.headerToolbar}>
              <Pressable
                style={({ pressed }) => [
                  styles.headerIconBtn,
                  pressed && styles.headerIconBtnPressed,
                  isBusy && styles.headerIconBtnDisabled,
                ]}
                onPress={() => void handleOpenHistory()}
                hitSlop={8}
                accessibilityLabel="Open chat history"
                disabled={isBusy}
              >
                <Ionicons name="chatbubbles-outline" size={19} color={colors.inkSoft} />
              </Pressable>

              <View style={styles.headerTitleWrap}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {activeConversationTitle || (hasConversation ? "Co-Pilot" : "Alpha Freight AI")}
                </Text>
                {conversationId && messages.length > 0 ? (
                  <Text style={styles.headerSubtitle}>Saved chat</Text>
                ) : !hasConversation ? (
                  <Text style={styles.headerSubtitle}>New chat</Text>
                ) : null}
              </View>

              <View style={styles.headerActions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.headerIconBtn,
                    pressed && styles.headerIconBtnPressed,
                    isBusy && styles.headerIconBtnDisabled,
                  ]}
                  onPress={() => void handleNewChat()}
                  hitSlop={8}
                  accessibilityLabel="Start new chat"
                  disabled={isBusy}
                >
                  <Ionicons name="create-outline" size={19} color={colors.inkSoft} />
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.headerIconBtn,
                    pressed && styles.headerIconBtnPressed,
                  ]}
                  onPress={dismissSheet}
                  hitSlop={8}
                  accessibilityLabel="Close assistant"
                >
                  <Ionicons name="close" size={20} color={colors.inkSoft} />
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.flex}>
            <GestureDetector gesture={scrollGesture}>
            <AnimatedScrollView
              ref={scrollRef}
              style={styles.chatScroll}
              contentContainerStyle={[
                styles.chatContent,
                { paddingBottom: scrollBottomPad },
                !hasConversation && !isKeyboardVisible && !inputFocused && styles.chatContentEmpty,
                (isKeyboardVisible || inputFocused) && styles.chatContentWithKeyboard,
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              scrollEventThrottle={16}
              nestedScrollEnabled
              bounces
              overScrollMode="always"
              onScroll={scrollHandler}
              scrollEnabled
            >
            {!hasConversation && !isBootstrapping ? (
              <>
                <WelcomeHero role={assistantType} />
                {paymentReminder && assistantType === "supplier" ? (
                  <View style={styles.reminderCard}>
                    <TypewriterAssistantReply
                      content={{
                        title: paymentReminder.title,
                        sectionLabel: paymentReminder.sectionLabel,
                        bullets: paymentReminder.bullets,
                        footer: paymentReminder.footer,
                        actions: paymentReminder.actions,
                      }}
                      onCopy={() => void handleCopy(paymentReminder)}
                      onActionPress={handleQuickAction}
                    />
                  </View>
                ) : null}
                {showSuggestions ? (
                  <View style={styles.suggestions}>
                    {suggestions.map((suggestion) => (
                      <Pressable
                        key={suggestion}
                        style={({ pressed }) => [styles.suggestionChip, pressed && styles.pressed]}
                        onPress={() => void submitPrompt(suggestion)}
                      >
                        <Text style={styles.suggestionText}>{suggestion}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </>
            ) : (
              <>
                {messages.map((message) =>
                  message.role === "user" ? (
                    <UserBubble key={message.id} text={message.text} />
                  ) : (
                    <TypewriterAssistantReply
                      key={message.id}
                      content={{
                        title: message.title,
                        sectionLabel: message.sectionLabel,
                        bullets: message.bullets,
                        footer: message.footer,
                        actions: message.actions,
                      }}
                      animate={message.id === typingMessageId}
                      onCopy={() => void handleCopy(message)}
                      onActionPress={handleQuickAction}
                      onTyping={scrollToEnd}
                      onRegenerate={
                        message.id === lastAssistantMessageId && !isBusy
                          ? () => void handleRegenerate(message.id)
                          : undefined
                      }
                    />
                  )
                )}

                {loadingMode ? (
                  <View style={styles.thinkingRow}>
                    <View style={styles.orbMini}>
                      <LottieView
                        source={require("@/assets/lottie/orb-ai-assistant.json")}
                        autoPlay
                        loop
                        style={styles.orbMiniLottie}
                      />
                    </View>
                    <ActivityIndicator size="small" color={colors.muted} />
                    <Text style={styles.thinkingText}>
                      {loadingMode === "searching" ? "Searching…" : "Thinking…"}
                    </Text>
                  </View>
                ) : null}
              </>
            )}
            </AnimatedScrollView>
            </GestureDetector>

            <View
            onLayout={(event) => {
              const nextHeight = Math.ceil(event.nativeEvent.layout.height);
              if (nextHeight > 0 && nextHeight !== composerHeight) {
                setComposerHeight(nextHeight);
              }
            }}
            style={[
              styles.composerDock,
              {
                bottom: composerBottomInset,
                paddingBottom: composerPadBottom,
              },
            ]}
          >
            <View style={styles.composerPill}>
              <Pressable
                style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
                onPress={() => undefined}
              >
                <Ionicons name="add" size={22} color={colors.ink} />
              </Pressable>

              <TextInput
                value={composerValue}
                onChangeText={setInput}
                placeholder="Ask Alpha Freight"
                placeholderTextColor="#A3A3A3"
                style={styles.composerInput}
                multiline
                maxLength={500}
                editable={!isBusy && !isListening}
                blurOnSubmit={false}
                returnKeyType="default"
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
              />

              <Pressable
                style={({ pressed }) => [
                  styles.iconBtn,
                  isListening && styles.micActive,
                  pressed && styles.pressed,
                ]}
                disabled={isBusy}
                onPress={() => void toggleListening()}
              >
                <Ionicons
                  name={isListening ? "mic" : "mic-outline"}
                  size={20}
                  color={isListening ? colors.danger : colors.muted}
                />
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.sendBtn,
                  (!input.trim() || isBusy) && styles.sendBtnDisabled,
                  pressed && input.trim() && !isBusy && styles.sendBtnPressed,
                ]}
                disabled={!input.trim() || isBusy}
                onPress={() => void submitPrompt(input)}
              >
                {isBusy ? (
                  <View style={styles.stopIcon} />
                ) : (
                  <Ionicons name="arrow-up" size={17} color={colors.white} />
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>

      <ChatHistorySheet
        visible={showHistorySheet}
        loading={historyLoading}
        conversations={savedConversations}
        activeConversationId={conversationId}
        onClose={() => setShowHistorySheet(false)}
        onSelect={(selectedConversationId) => void handleSelectConversation(selectedConversationId)}
      />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
    position: "relative",
  },
  header: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    zIndex: 20,
    elevation: 20,
  },
  dragZone: {
    width: "100%",
    alignItems: "center",
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    minHeight: 24,
  },
  grabber: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#D4D4D4",
  },
  headerToolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    minHeight: 48,
    gap: spacing.sm,
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "600",
    color: colors.muted,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F4F4F5",
    borderWidth: 1,
    borderColor: "#EBEBEB",
    alignItems: "center",
    justifyContent: "center",
  },
  headerIconBtnPressed: {
    backgroundColor: "#ECECEC",
    transform: [{ scale: 0.96 }],
  },
  headerIconBtnDisabled: {
    opacity: 0.45,
  },
  chatScroll: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.lg,
  },
  chatContentEmpty: {
    flexGrow: 1,
    justifyContent: "center",
    paddingBottom: spacing.xl,
  },
  chatContentWithKeyboard: {
    flexGrow: 1,
    justifyContent: "flex-start",
    paddingBottom: spacing.md,
  },
  hero: {
    alignItems: "center",
    gap: 10,
    paddingHorizontal: spacing.md,
  },
  heroOrb: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#EBEBEB",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 4,
    ...shadow.soft,
  },
  heroOrbLottie: {
    width: 76,
    height: 76,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.6,
    color: colors.ink,
    textAlign: "center",
  },
  heroSub: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "500",
    color: colors.muted,
    textAlign: "center",
    maxWidth: 280,
  },
  userRow: {
    alignItems: "flex-end",
  },
  userBubble: {
    maxWidth: "88%",
    backgroundColor: "#F4F4F5",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  userText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500",
    color: colors.ink,
  },
  thinkingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginLeft: 4,
  },
  orbMini: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: colors.white,
  },
  orbMiniLottie: {
    width: 28,
    height: 28,
  },
  thinkingText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.muted,
  },
  reminderCard: {
    marginTop: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: spacing.md,
    ...shadow.soft,
  },
  suggestions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: spacing.lg,
  },
  suggestionChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    backgroundColor: colors.white,
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.inkSoft,
  },
  composerDock: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    backgroundColor: "#FAFAFA",
    zIndex: 12,
    elevation: 12,
  },
  composerPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    paddingLeft: 4,
    paddingRight: 4,
    paddingVertical: 4,
    minHeight: COMPOSER_MIN_HEIGHT,
    gap: 2,
    ...shadow.soft,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  micActive: {
    backgroundColor: colors.dangerSoft,
  },
  composerInput: {
    flex: 1,
    minHeight: 36,
    maxHeight: 96,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "500",
    color: colors.ink,
    paddingHorizontal: 6,
    paddingVertical: Platform.OS === "ios" ? 8 : 6,
    textAlignVertical: "center",
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    opacity: 0.28,
  },
  sendBtnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.96 }],
  },
  stopIcon: {
    width: 11,
    height: 11,
    borderRadius: 2,
    backgroundColor: colors.white,
  },
  pressed: {
    opacity: 0.72,
  },
});
