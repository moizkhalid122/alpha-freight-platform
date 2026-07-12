import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import LoadRouteMap from "@/components/loads/LoadRouteMap";
import UkFlag from "@/components/ui/UkFlag";
import { useLoadRoute } from "@/hooks/useLoadRoute";
import { formatDistance, formatDuration } from "@/lib/mapbox";
import { prefetchSupplierDashboard } from "@/lib/supplier-dashboard-cache";
import { formatSupplierMoney } from "@/lib/supplier-payments";
import { prefetchSupplierMyPosts } from "@/lib/supplier-my-posts-cache";
import {
  DEFAULT_POST_LOAD_FORM,
  EQUIPMENT_OPTIONS,
  PostLoadFormData,
  PostLoadPaymentRoute,
  REQUIREMENT_OPTIONS,
  URGENCY_OPTIONS,
  estimatePostLoadPrice,
  formatEquipmentLabel,
  formatPostLoadDateInput,
  formatPostLoadTimeInput,
  submitSupplierPostLoad,
  validatePostLoadStep,
} from "@/lib/supplier-post-load";
import PostLoadAiSheet from "@/components/supplier/PostLoadAiSheet";
import { consumeSupplierPostLoadDraft } from "@/lib/supplier-post-load-draft";
import { colors, radius, shadow, spacing } from "@/lib/theme";

const STEPS = [
  { id: 1, title: "Route", icon: "navigate-outline" as const },
  { id: 2, title: "Cargo", icon: "cube-outline" as const },
  { id: 3, title: "Vehicle", icon: "bus-outline" as const },
  { id: 4, title: "Review", icon: "clipboard-outline" as const },
];

const SPRING_SOFT = { damping: 22, stiffness: 240, mass: 0.85 };
const SPRING_PRESS = { damping: 18, stiffness: 380, mass: 0.7 };

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function AmbientBackground() {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withTiming(1, { duration: 1400, easing: Easing.out(Easing.cubic) });
  }, [pulse]);

  const blobOne = useAnimatedStyle(() => ({
    opacity: 0.35 * pulse.value,
    transform: [{ scale: 0.92 + pulse.value * 0.08 }],
  }));

  const blobTwo = useAnimatedStyle(() => ({
    opacity: 0.28 * pulse.value,
    transform: [{ scale: 0.9 + pulse.value * 0.1 }],
  }));

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[styles.ambientBlobOne, blobOne]} />
      <Animated.View style={[styles.ambientBlobTwo, blobTwo]} />
    </View>
  );
}

function FormCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.formCard}>{children}</View>;
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline,
  maxLength,
  formatValue,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "numeric" | "decimal-pad" | "number-pad";
  multiline?: boolean;
  maxLength?: number;
  formatValue?: (value: string) => string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={(text) => onChangeText(formatValue ? formatValue(text) : text)}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedLight}
        style={[styles.fieldInput, multiline && styles.fieldInputMultiline]}
        keyboardType={keyboardType}
        multiline={multiline}
        maxLength={maxLength}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

function StepProgressBar({ step }: { step: number }) {
  const current = STEPS[step - 1];

  return (
    <View style={styles.stepBarWrap}>
      <View style={styles.stepBarTrack}>
        {STEPS.map((item) => {
          const filled = item.id <= step;
          return (
            <View
              key={item.id}
              style={[styles.stepBarSegment, filled && styles.stepBarSegmentFilled]}
            />
          );
        })}
      </View>
      <View style={styles.stepMetaRow}>
        <View style={styles.stepBadge}>
          <Ionicons name={current.icon} size={12} color={colors.ink} />
          <Text style={styles.stepBadgeText}>
            Step {step} of {STEPS.length}
          </Text>
        </View>
        <Text style={styles.stepMetaLabel}>{current.title}</Text>
      </View>
    </View>
  );
}

function PaymentChoiceCard({
  icon,
  title,
  subtitle,
  trailing,
  disabled,
  onPress,
  index,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  trailing: React.ReactNode;
  disabled?: boolean;
  onPress: () => void;
  index: number;
}) {
  const scale = useSharedValue(1);
  const arrowX = useSharedValue(0);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: arrowX.value }],
  }));

  return (
    <Animated.View
      entering={FadeInUp.delay(120 + index * 100)
        .duration(560)
        .easing(Easing.out(Easing.cubic))}
    >
      <AnimatedPressable
        style={[styles.payLaterCard, cardStyle]}
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.982, SPRING_PRESS);
          arrowX.value = withSpring(4, SPRING_PRESS);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, SPRING_SOFT);
          arrowX.value = withSpring(0, SPRING_SOFT);
        }}
      >
        <View style={styles.payLaterIconWrap}>
          <Ionicons name={icon} size={20} color={colors.ink} />
        </View>
        <View style={styles.payLaterCopy}>
          <Text style={styles.payLaterTitle}>{title}</Text>
          <Text style={styles.payLaterSub}>{subtitle}</Text>
        </View>
        <Animated.View style={arrowStyle}>{trailing}</Animated.View>
      </AnimatedPressable>
    </Animated.View>
  );
}

function PayNowButton({
  amount,
  disabled,
  onPress,
}: {
  amount: number;
  disabled?: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInUp.delay(80).duration(560).easing(Easing.out(Easing.cubic))}>
      <AnimatedPressable
        style={[styles.payNowBtn, btnStyle]}
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.985, SPRING_PRESS);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, SPRING_SOFT);
        }}
      >
        <View style={styles.payNowLeft}>
          <View style={styles.payNowIconWrap}>
            <Ionicons name="flash" size={18} color={colors.ink} />
          </View>
          <View style={styles.payNowCopy}>
            <Text style={styles.payNowTitle}>Pay now</Text>
            <Text style={styles.payNowSub}>Go live after secure card payment</Text>
          </View>
        </View>
        <View style={styles.payNowRight}>
          <Text style={styles.payNowAmount}>{formatSupplierMoney(amount)}</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.ink} />
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

function MarketEstimateCard({
  estimating,
  suggestedPrice,
}: {
  estimating: boolean;
  suggestedPrice: number | null;
}) {
  return (
    <View style={styles.estimateCard}>
      <LinearGradient
        colors={["#FFFFFF", "#F8FAFC"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.estimateGradient}
      >
        <View style={styles.estimateAccent} />
        <View style={styles.estimateBody}>
          <View style={styles.estimateTop}>
            <View style={styles.estimateBadge}>
              <UkFlag size={12} />
              <Text style={styles.estimateBadgeText}>Market estimate</Text>
            </View>
            {estimating ? (
              <ActivityIndicator color={colors.ink} size="small" />
            ) : (
              <Text style={styles.estimateValue}>
                {suggestedPrice ? formatSupplierMoney(suggestedPrice) : "—"}
              </Text>
            )}
          </View>
          <Text style={styles.estimateHint}>
            Based on route distance, weight, and urgency. Adjust your budget below.
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

function ReviewRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.reviewRow}>
      <View style={styles.reviewRowIcon}>
        <Ionicons name={icon} size={15} color={colors.ink} />
      </View>
      <View style={styles.reviewRowCopy}>
        <Text style={styles.reviewLabel}>{label}</Text>
        <Text style={styles.reviewValue} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function SupplierPostLoadScreen() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<PostLoadFormData>(DEFAULT_POST_LOAD_FORM);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPaymentChoice, setShowPaymentChoice] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [suggestedPrice, setSuggestedPrice] = useState<number | null>(null);
  const [showAiSheet, setShowAiSheet] = useState(false);

  const routeEnabled = form.origin.trim().length >= 3 && form.destination.trim().length >= 3;
  const { route, loading: routeLoading } = useLoadRoute(form.origin, form.destination, routeEnabled);

  const patchForm = useCallback((patch: Partial<PostLoadFormData>) => {
    setForm((current) => ({ ...current, ...patch }));
  }, []);

  useEffect(() => {
    const draft = consumeSupplierPostLoadDraft();
    if (!draft) return;
    patchForm(draft);
    setFlashMessage("AI draft applied — please review all fields before continuing.");
  }, [patchForm]);

  const applyAiDraft = useCallback(
    (draft: Partial<PostLoadFormData>, summary: string) => {
      patchForm(draft);
      setFlashMessage(`${summary} — review and edit anything before continuing.`);
    },
    [patchForm]
  );

  const pageTitle = useMemo(() => {
    if (showPaymentChoice) return "When should\nyou pay?";
    switch (step) {
      case 1:
        return "Where is this\nload going?";
      case 2:
        return "What's in the\ncargo?";
      case 3:
        return "Vehicle &\nrequirements";
      case 4:
        return "Review &\nbudget";
      default:
        return "Post load";
    }
  }, [step, showPaymentChoice]);

  useEffect(() => {
    if (!routeEnabled || !form.weight.trim()) {
      setSuggestedPrice(null);
      return;
    }

    setEstimating(true);
    const timer = setTimeout(() => {
      setSuggestedPrice(
        estimatePostLoadPrice({
          weight: form.weight,
          urgency: form.urgency,
          distanceMeters: route?.distanceMeters,
        })
      );
      setEstimating(false);
    }, 700);

    return () => clearTimeout(timer);
  }, [form.origin, form.destination, form.weight, form.urgency, route?.distanceMeters, routeEnabled]);

  useEffect(() => {
    if (!route?.durationSeconds || !form.pickupDate.trim() || !form.pickupTime.trim()) return;

    const [year, month, day] = form.pickupDate.split("-").map(Number);
    const [hours, minutes] = form.pickupTime.split(":").map(Number);
    if (!year || !month || !day) return;

    const pickupDate = new Date(year, month - 1, day, hours || 0, minutes || 0);
    if (Number.isNaN(pickupDate.getTime())) return;

    let totalSeconds = route.durationSeconds * 1.25;
    const drivingHours = totalSeconds / 3600;
    totalSeconds += Math.floor(drivingHours / 4.5) * 45 * 60;

    const deliveryDate = new Date(pickupDate.getTime() + totalSeconds * 1000);
    const dDate = `${deliveryDate.getFullYear()}-${String(deliveryDate.getMonth() + 1).padStart(2, "0")}-${String(deliveryDate.getDate()).padStart(2, "0")}`;
    const dTime = `${String(deliveryDate.getHours()).padStart(2, "0")}:${String(deliveryDate.getMinutes()).padStart(2, "0")}`;

    if (form.deliveryDate !== dDate || form.deliveryTime !== dTime) {
      patchForm({ deliveryDate: dDate, deliveryTime: dTime });
    }
  }, [route?.durationSeconds, form.pickupDate, form.pickupTime, form.deliveryDate, form.deliveryTime, patchForm]);

  const reviewPrice = useMemo(() => {
    const budget = parseFloat(form.maxBudget);
    if (Number.isFinite(budget) && budget > 0) return budget;
    return suggestedPrice || 0;
  }, [form.maxBudget, suggestedPrice]);

  const handleNext = () => {
    const error = validatePostLoadStep(step, form);
    if (error) {
      setFlashMessage(error);
      return;
    }
    setFlashMessage(null);
    if (step === 4) {
      setShowPaymentChoice(true);
      return;
    }
    setStep((current) => Math.min(current + 1, 4));
  };

  const handleBack = () => {
    if (submitting) return;
    if (showPaymentChoice) {
      setShowPaymentChoice(false);
      return;
    }
    if (step > 1) {
      setStep((current) => current - 1);
      setFlashMessage(null);
      return;
    }
    router.back();
  };

  const handleSubmit = async (paymentRoute: PostLoadPaymentRoute) => {
    const error = validatePostLoadStep(4, form);
    if (error) {
      setFlashMessage(error);
      return;
    }

    setSubmitting(true);
    setFlashMessage(null);

    const result = await submitSupplierPostLoad({
      form,
      paymentRoute,
      suggestedPrice: suggestedPrice || 0,
    });

    setSubmitting(false);

    if (!result.ok) {
      setFlashMessage(result.error);
      return;
    }

    void prefetchSupplierMyPosts(true);
    void prefetchSupplierDashboard(true);

    if (result.paymentRoute === "pay-now") {
      router.replace(`/complete-payment?loadId=${result.loadId}`);
      return;
    }

    router.replace("/(supplier-main)/posts");
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#FFFFFF", "#FAFBFC", "#FFFFFF"]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <AmbientBackground />

      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.header}>
            <Pressable
              style={({ pressed }) => [styles.backBtn, pressed && styles.pressedSoft]}
              onPress={handleBack}
            >
              <Ionicons name="chevron-back" size={20} color={colors.white} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.aiHeaderBtn, pressed && styles.pressedSoft]}
              onPress={() => setShowAiSheet(true)}
              accessibilityRole="button"
              accessibilityLabel="Fill with AI"
            >
              <View style={styles.aiHeaderOrb}>
                <LottieView
                  source={require("@/assets/lottie/orb-ai-assistant.json")}
                  autoPlay
                  loop
                  style={styles.aiHeaderOrbLottie}
                />
              </View>
              <Text style={styles.aiHeaderBtnText}>Fill with AI</Text>
            </Pressable>
          </View>

          <Animated.Text
            key={`title-${showPaymentChoice ? "pay" : step}`}
            entering={FadeIn.duration(360).easing(Easing.out(Easing.cubic))}
            exiting={FadeOut.duration(200)}
            style={styles.pageTitle}
          >
            {pageTitle}
          </Animated.Text>

          {!showPaymentChoice ? <StepProgressBar step={step} /> : null}

          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {flashMessage ? (
              <Animated.View
                entering={FadeInUp.duration(320).easing(Easing.out(Easing.cubic))}
                exiting={FadeOut.duration(180)}
                style={styles.flashBanner}
              >
                <Ionicons name="alert-circle-outline" size={18} color={colors.ink} />
                <Text style={styles.flashText}>{flashMessage}</Text>
              </Animated.View>
            ) : null}

            {showPaymentChoice ? (
              <Animated.View
                key="payment-choice"
                entering={SlideInRight.duration(420).easing(Easing.out(Easing.cubic))}
                exiting={SlideOutLeft.duration(280)}
                style={styles.choiceWrap}
              >
                <View style={styles.paymentHero}>
                  <Text style={styles.paymentHeroLabel}>Total to publish</Text>
                  <Text style={styles.paymentHeroAmount}>{formatSupplierMoney(reviewPrice)}</Text>
                  <Text style={styles.paymentHeroSub}>
                    Choose when you want to complete payment for this load.
                  </Text>
                </View>

                <PayNowButton
                  amount={reviewPrice}
                  disabled={submitting}
                  onPress={() => void handleSubmit("pay-now")}
                />

                <PaymentChoiceCard
                  index={1}
                  icon="time-outline"
                  title="Pay later"
                  subtitle="Save load and complete payment within 7 days"
                  disabled={submitting}
                  trailing={<Ionicons name="arrow-forward" size={17} color="#B0B8C4" />}
                  onPress={() => void handleSubmit("pay-later")}
                />

                {submitting ? (
                  <View style={styles.submittingRow}>
                    <ActivityIndicator color={colors.ink} />
                    <Text style={styles.submittingText}>Saving your load…</Text>
                  </View>
                ) : null}
              </Animated.View>
            ) : step === 1 ? (
              <Animated.View
                key="step-1"
                entering={SlideInRight.duration(420).easing(Easing.out(Easing.cubic))}
                exiting={SlideOutLeft.duration(280)}
                style={styles.stepWrap}
              >
                <FormCard>
                  <Field
                    label="Load title (optional)"
                    value={form.title}
                    onChangeText={(value) => patchForm({ title: value })}
                    placeholder="e.g. Birmingham steel delivery"
                  />
                  <Field
                    label="Pickup location"
                    value={form.origin}
                    onChangeText={(value) => patchForm({ origin: value })}
                    placeholder="City, postcode or address"
                  />
                  <Field
                    label="Delivery location"
                    value={form.destination}
                    onChangeText={(value) => patchForm({ destination: value })}
                    placeholder="City, postcode or address"
                  />
                  <View style={styles.splitRow}>
                    <View style={styles.splitField}>
                      <Field
                        label="Pickup date"
                        value={form.pickupDate}
                        onChangeText={(value) => patchForm({ pickupDate: value })}
                        placeholder="YYYY-MM-DD"
                        keyboardType="number-pad"
                        maxLength={10}
                        formatValue={formatPostLoadDateInput}
                      />
                    </View>
                    <View style={styles.splitField}>
                      <Field
                        label="Pickup time"
                        value={form.pickupTime}
                        onChangeText={(value) => patchForm({ pickupTime: value })}
                        placeholder="HH:MM"
                        keyboardType="number-pad"
                        maxLength={5}
                        formatValue={formatPostLoadTimeInput}
                      />
                    </View>
                  </View>
                </FormCard>

                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionLabel}>Urgency</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.urgencyRow}
                  >
                    {URGENCY_OPTIONS.map((option) => {
                      const active = form.urgency === option.value;
                      return (
                        <Pressable
                          key={option.value}
                          style={[styles.urgencyChip, active && styles.urgencyChipActive]}
                          onPress={() => patchForm({ urgency: option.value })}
                        >
                          <Text style={[styles.urgencyTitle, active && styles.urgencyTitleActive]}>
                            {option.label}
                          </Text>
                          <Text style={styles.urgencyHint}>{option.hint}</Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>

                {routeEnabled ? (
                  <View style={styles.mapCard}>
                    <LoadRouteMap origin={form.origin} destination={form.destination} height={132} />
                    <View style={styles.routeMetaRow}>
                      <View style={styles.routeMetaPill}>
                        <Ionicons name="speedometer-outline" size={14} color={colors.ink} />
                        <Text style={styles.routeMetaText}>
                          {routeLoading ? "Calculating…" : formatDistance(route?.distanceMeters)}
                        </Text>
                      </View>
                      <View style={styles.routeMetaPill}>
                        <Ionicons name="time-outline" size={14} color={colors.ink} />
                        <Text style={styles.routeMetaText}>
                          {routeLoading ? "Calculating…" : formatDuration(route?.durationSeconds)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : null}
              </Animated.View>
            ) : step === 2 ? (
              <Animated.View
                key="step-2"
                entering={SlideInRight.duration(420).easing(Easing.out(Easing.cubic))}
                exiting={SlideOutLeft.duration(280)}
                style={styles.stepWrap}
              >
                <FormCard>
                  <Field
                    label="Cargo type"
                    value={form.cargoType}
                    onChangeText={(value) => patchForm({ cargoType: value })}
                    placeholder="Pallets, steel, machinery…"
                  />
                  <Field
                    label="Weight (kg)"
                    value={form.weight}
                    onChangeText={(value) => patchForm({ weight: value.replace(/[^\d.]/g, "") })}
                    placeholder="1200"
                    keyboardType="decimal-pad"
                  />
                  <View style={styles.splitRow}>
                    <View style={styles.splitField}>
                      <Field
                        label="Volume (optional)"
                        value={form.volume}
                        onChangeText={(value) => patchForm({ volume: value })}
                        placeholder="12 m³"
                      />
                    </View>
                    <View style={styles.splitField}>
                      <Field
                        label="Value £ (optional)"
                        value={form.value}
                        onChangeText={(value) => patchForm({ value: value.replace(/[^\d.]/g, "") })}
                        placeholder="25000"
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>
                  <Field
                    label="Special instructions"
                    value={form.description}
                    onChangeText={(value) => patchForm({ description: value })}
                    placeholder="Loading bay, contact on arrival…"
                    multiline
                  />
                </FormCard>
              </Animated.View>
            ) : step === 3 ? (
              <Animated.View
                key="step-3"
                entering={SlideInRight.duration(420).easing(Easing.out(Easing.cubic))}
                exiting={SlideOutLeft.duration(280)}
                style={styles.stepWrap}
              >
                <FormCard>
                  <Text style={styles.sectionLabel}>Vehicle type</Text>
                  <View style={styles.equipmentGrid}>
                    {EQUIPMENT_OPTIONS.map((option) => {
                      const active = form.equipment === option.value;
                      return (
                        <Pressable
                          key={option.value}
                          style={[styles.equipmentChip, active && styles.equipmentChipActive]}
                          onPress={() => patchForm({ equipment: option.value })}
                        >
                          <Text style={[styles.equipmentText, active && styles.equipmentTextActive]}>
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>Requirements</Text>
                  <View style={styles.requirementGrid}>
                    {REQUIREMENT_OPTIONS.map((option) => {
                      const active = form[option.key];
                      return (
                        <Pressable
                          key={option.key}
                          style={[styles.requirementCard, active && styles.requirementCardActive]}
                          onPress={() => patchForm({ [option.key]: !active })}
                        >
                          <View
                            style={[
                              styles.requirementIconWrap,
                              active && styles.requirementIconWrapActive,
                            ]}
                          >
                            <Ionicons
                              name={option.icon}
                              size={16}
                              color={active ? colors.ink : colors.muted}
                            />
                          </View>
                          <Text
                            style={[styles.requirementText, active && styles.requirementTextActive]}
                          >
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </FormCard>
              </Animated.View>
            ) : (
              <Animated.View
                key="step-4"
                entering={SlideInRight.duration(420).easing(Easing.out(Easing.cubic))}
                exiting={SlideOutLeft.duration(280)}
                style={styles.stepWrap}
              >
                <MarketEstimateCard estimating={estimating} suggestedPrice={suggestedPrice} />

                <View style={styles.reviewCard}>
                  <Text style={styles.reviewTitle}>Shipment summary</Text>
                  <ReviewRow
                    icon="navigate-outline"
                    label="Route"
                    value={`${form.origin} → ${form.destination}`}
                  />
                  <ReviewRow
                    icon="calendar-outline"
                    label="Pickup"
                    value={`${form.pickupDate || "—"} ${form.pickupTime}`.trim()}
                  />
                  <ReviewRow
                    icon="flag-outline"
                    label="Delivery ETA"
                    value={`${form.deliveryDate || "—"} ${form.deliveryTime}`.trim()}
                  />
                  <ReviewRow
                    icon="cube-outline"
                    label="Cargo"
                    value={`${form.cargoType} · ${form.weight || "0"} kg`}
                  />
                  <ReviewRow
                    icon="bus-outline"
                    label="Vehicle"
                    value={formatEquipmentLabel(form.equipment)}
                  />
                </View>

                <FormCard>
                  <View style={styles.splitRow}>
                    <View style={styles.splitField}>
                      <Field
                        label="Min budget £"
                        value={form.minBudget}
                        onChangeText={(value) =>
                          patchForm({ minBudget: value.replace(/[^\d.]/g, "") })
                        }
                        placeholder="Optional"
                        keyboardType="decimal-pad"
                      />
                    </View>
                    <View style={styles.splitField}>
                      <Field
                        label="Max budget £"
                        value={form.maxBudget}
                        onChangeText={(value) =>
                          patchForm({ maxBudget: value.replace(/[^\d.]/g, "") })
                        }
                        placeholder={suggestedPrice ? String(suggestedPrice) : "Required"}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>

                  <Pressable
                    style={styles.agreementRow}
                    onPress={() => patchForm({ agreementAccepted: !form.agreementAccepted })}
                  >
                    <View style={[styles.checkbox, form.agreementAccepted && styles.checkboxActive]}>
                      {form.agreementAccepted ? (
                        <Ionicons name="checkmark" size={13} color={colors.ink} />
                      ) : null}
                    </View>
                    <Text style={styles.agreementText}>
                      I confirm this load information is accurate and agree to Alpha Freight
                      marketplace terms.
                    </Text>
                  </Pressable>
                </FormCard>
              </Animated.View>
            )}
          </ScrollView>

          {!showPaymentChoice ? (
            <Animated.View entering={FadeInDown.duration(320)} style={styles.footer}>
              <Pressable
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                onPress={handleNext}
              >
                <Text style={styles.primaryBtnText}>
                  {step === 4 ? "Choose payment option" : "Continue"}
                </Text>
                <Ionicons name="arrow-forward" size={18} color={colors.ink} />
              </Pressable>
            </Animated.View>
          ) : null}
        </KeyboardAvoidingView>
      </SafeAreaView>

      {showAiSheet ? (
        <PostLoadAiSheet
          visible={showAiSheet}
          onClose={() => setShowAiSheet(false)}
          onApply={applyAiDraft}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  flex: { flex: 1 },
  safe: { flex: 1 },
  ambientBlobOne: {
    position: "absolute",
    top: -40,
    right: -30,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.brandSoft,
  },
  ambientBlobTwo: {
    position: "absolute",
    bottom: 120,
    left: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(30, 77, 59, 0.06)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 2,
  },
  aiHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.brandSoft,
    borderWidth: 1,
    borderColor: colors.ink,
  },
  aiHeaderBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.ink,
  },
  aiHeaderOrb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    overflow: "hidden",
  },
  aiHeaderOrbLottie: {
    width: 22,
    height: 22,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#A8B0BC",
    alignItems: "center",
    justifyContent: "center",
    ...shadow.soft,
  },
  pageTitle: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.5,
    lineHeight: 30,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  stepBarWrap: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: 8,
  },
  stepBarTrack: {
    flexDirection: "row",
    gap: 6,
  },
  stepBarSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#E8ECF1",
  },
  stepBarSegmentFilled: {
    backgroundColor: colors.ink,
  },
  stepMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.brandSoft,
  },
  stepBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: colors.ink,
  },
  stepMetaLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: 12,
  },
  stepWrap: { gap: 12 },
  formCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: spacing.md,
    gap: 12,
    ...shadow.soft,
  },
  sectionBlock: { gap: 8 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.muted,
  },
  sectionLabelSpaced: { marginTop: 4 },
  field: { gap: 6 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.muted,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.inputFill,
    paddingHorizontal: 13,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
  },
  fieldInputMultiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  splitRow: { flexDirection: "row", gap: 10 },
  splitField: { flex: 1 },
  urgencyRow: { gap: 8, paddingRight: 4 },
  urgencyChip: {
    minWidth: 108,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#E8ECF1",
    backgroundColor: "#F2F4F7",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  urgencyChipActive: {
    borderColor: colors.ink,
    backgroundColor: colors.brandSoft,
  },
  urgencyTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.ink,
  },
  urgencyTitleActive: { color: colors.ink },
  urgencyHint: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.muted,
  },
  mapCard: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    ...shadow.soft,
  },
  routeMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  routeMetaPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.canvasMuted,
  },
  routeMetaText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.ink,
  },
  equipmentGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  equipmentChip: {
    borderWidth: 1.5,
    borderColor: "#E8ECF1",
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 8,
    backgroundColor: "#F2F4F7",
  },
  equipmentChipActive: {
    borderColor: colors.ink,
    backgroundColor: colors.brandSoft,
  },
  equipmentText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
  },
  equipmentTextActive: { color: colors.ink },
  requirementGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  requirementCard: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#E8ECF1",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "#F2F4F7",
  },
  requirementCardActive: {
    borderColor: colors.ink,
    backgroundColor: colors.brandSoft,
  },
  requirementIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ECEFF3",
  },
  requirementIconWrapActive: {
    backgroundColor: colors.white,
    borderColor: colors.ink,
  },
  requirementText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted,
  },
  requirementTextActive: { color: colors.ink },
  estimateCard: {
    borderRadius: 20,
    overflow: "hidden",
    ...shadow.soft,
  },
  estimateGradient: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    overflow: "hidden",
    flexDirection: "row",
  },
  estimateAccent: {
    width: 4,
    backgroundColor: colors.brand,
  },
  estimateBody: {
    flex: 1,
    padding: spacing.md,
    gap: 8,
  },
  estimateTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  estimateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.canvasMuted,
    borderWidth: 1,
    borderColor: "#ECEFF3",
  },
  estimateBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.ink,
  },
  estimateValue: {
    fontSize: 26,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.7,
  },
  estimateHint: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
    color: colors.muted,
  },
  reviewCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: spacing.md,
    gap: 10,
    ...shadow.soft,
  },
  reviewTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: colors.muted,
    marginBottom: 2,
  },
  reviewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  reviewRowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.canvasMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewRowCopy: { flex: 1, gap: 1 },
  reviewLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.mutedLight,
  },
  reviewValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.ink,
    lineHeight: 18,
  },
  agreementRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingTop: 2,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkboxActive: {
    backgroundColor: colors.brand,
    borderColor: colors.ink,
  },
  agreementText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
    color: colors.muted,
  },
  paymentHero: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: 4,
    alignItems: "center",
    ...shadow.soft,
  },
  paymentHeroLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.muted,
  },
  paymentHeroAmount: {
    fontSize: 34,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.8,
  },
  paymentHeroSub: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
    color: colors.muted,
    textAlign: "center",
    paddingHorizontal: 8,
    marginTop: 2,
  },
  payNowBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: colors.brand,
    borderWidth: 1.5,
    borderColor: colors.ink,
    ...shadow.card,
  },
  payNowLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  payNowIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1,
    borderColor: "rgba(21,27,36,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  payNowCopy: { flex: 1, gap: 2 },
  payNowTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.2,
  },
  payNowSub: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.inkMuted,
    lineHeight: 15,
  },
  payNowRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  payNowAmount: {
    fontSize: 15,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.3,
  },
  choiceWrap: { gap: 12 },
  payLaterCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: 68,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: "#E8ECF1",
    ...shadow.soft,
  },
  payLaterIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#F2F4F7",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ECEFF3",
  },
  payLaterCopy: { flex: 1, gap: 2 },
  payLaterTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.2,
  },
  payLaterSub: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.muted,
    lineHeight: 15,
  },
  submittingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 8,
  },
  submittingText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.muted,
  },
  flashBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: colors.brandSoft,
    borderWidth: 1,
    borderColor: colors.brandGlow,
  },
  flashText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: colors.ink,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.96)",
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.ink,
    paddingVertical: 15,
    paddingHorizontal: 20,
    ...shadow.soft,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.ink,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },
  pressedSoft: {
    opacity: 0.88,
    transform: [{ scale: 0.96 }],
  },
});
