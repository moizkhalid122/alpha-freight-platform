import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageSourcePropType,
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
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import ConfettiPop from "@/components/ui/ConfettiPop";
import UkFlag from "@/components/ui/UkFlag";
import SlideToConfirm from "@/components/wallet/SlideToConfirm";
import PaymentStatusOverlay, {
  PaymentOverlayPhase,
} from "@/components/supplier/payments/PaymentStatusOverlay";
import {
  SupplierCheckoutOrder,
  fetchSupplierCheckoutOrder,
} from "@/lib/supplier-payment-checkout";
import {
  confirmSupplierStripePayment,
  createSupplierStripePaymentMethod,
} from "@/lib/supplier-stripe-payment";
import { processSupplierPlatformPayment } from "@/lib/supplier-platform-pay";
import { isLiveStripeEnabled } from "@/lib/stripe-config";
import { CardField, usePlatformPay, useStripe } from "@stripe/stripe-react-native";
import SupplierBankTransferPanel from "@/components/supplier/payments/SupplierBankTransferPanel";
import { submitSupplierBankTransferRequest } from "@/lib/supplier-bank-transfer";
import { formatSupplierMoney } from "@/lib/supplier-payments";
import { setCachedSupplierDashboard } from "@/lib/supplier-dashboard-cache";
import { setCachedSupplierMyPosts } from "@/lib/supplier-my-posts-cache";
import { prefetchSupplierMyPosts } from "@/lib/supplier-my-posts-cache";
import { colors, radius, shadow, spacing } from "@/lib/theme";

type PaymentMethodId = "bank-transfer" | "card" | "apple-pay" | "google-pay";
type CheckoutStep = "methods" | "card" | "confirm" | "success" | "bank-transfer" | "bank-submitted";

type MethodOption = {
  id: PaymentMethodId;
  label: string;
  hint?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  imageIcon?: ImageSourcePropType;
  iconColor: string;
  iconBg: string;
  accent: string;
  platforms?: ("ios" | "android")[];
};

const GOOGLE_PAY_ICON = require("@/assets/google-icon.png");

const SPRING_SOFT = { damping: 22, stiffness: 240, mass: 0.85 };
const SPRING_PRESS = { damping: 18, stiffness: 380, mass: 0.7 };

const PAYMENT_METHODS: MethodOption[] = [
  {
    id: "bank-transfer",
    label: "Bank Transfer",
    hint: "Manual verification",
    icon: "business-outline",
    iconColor: "#1f5c45",
    iconBg: "#ECFDF3",
    accent: "#1f5c45",
  },
  {
    id: "card",
    label: "Debit or Credit",
    hint: "Both cards accepted",
    icon: "card-outline",
    iconColor: colors.ink,
    iconBg: "#FFFFFF",
    accent: colors.ink,
  },
  {
    id: "apple-pay",
    label: "Apple Pay",
    icon: "logo-apple",
    iconColor: colors.ink,
    iconBg: "#FFFFFF",
    accent: colors.ink,
    platforms: ["ios"],
  },
  {
    id: "google-pay",
    label: "Google Pay",
    imageIcon: GOOGLE_PAY_ICON,
    iconColor: colors.ink,
    iconBg: "#FFFFFF",
    accent: colors.ink,
    platforms: ["android"],
  },
];

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

function MethodCard({
  option,
  index,
  onPress,
  recommended = false,
}: {
  option: MethodOption;
  index: number;
  onPress: () => void;
  recommended?: boolean;
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
      entering={FadeInUp.delay(140 + index * 90)
        .duration(520)
        .easing(Easing.out(Easing.cubic))
        .springify()
        .damping(24)
        .stiffness(220)}
    >
      <AnimatedPressable
        style={[styles.methodCard, recommended && styles.methodCardFeatured, cardStyle]}
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.985, SPRING_PRESS);
          arrowX.value = withSpring(4, SPRING_PRESS);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, SPRING_SOFT);
          arrowX.value = withSpring(0, SPRING_SOFT);
        }}
      >
        <View style={[styles.methodIconWrap, { backgroundColor: option.iconBg }]}>
          {option.imageIcon ? (
            <Image source={option.imageIcon} style={styles.methodImageIcon} />
          ) : (
            <Ionicons name={option.icon || "card-outline"} size={22} color={option.iconColor} />
          )}
        </View>
        <View style={styles.methodCopy}>
          <View style={styles.methodLabelRow}>
            <Text style={styles.methodLabel}>{option.label}</Text>
            {recommended ? (
              <View style={styles.methodBadge}>
                <Text style={styles.methodBadgeText}>Popular</Text>
              </View>
            ) : null}
          </View>
          {option.hint ? <Text style={styles.methodHint}>{option.hint}</Text> : null}
        </View>
        <Animated.View style={[styles.methodArrow, arrowStyle]}>
          <View style={styles.methodArrowCircle}>
            <Ionicons name="chevron-forward" size={16} color={colors.ink} />
          </View>
        </Animated.View>
      </AnimatedPressable>
    </Animated.View>
  );
}

function PaymentMethodsSummary({
  order,
}: {
  order: SupplierCheckoutOrder;
}) {
  return (
    <Animated.View
      entering={FadeInDown.duration(420).easing(Easing.out(Easing.cubic))}
      style={styles.methodsSummaryCard}
    >
      <View style={styles.methodsSummaryTop}>
        <View style={styles.methodsSummaryBadge}>
          <UkFlag size={14} />
          <Text style={styles.methodsSummaryBadgeText}>Checkout</Text>
        </View>
        <Text style={styles.methodsSummaryCode}>{order.loadCode}</Text>
      </View>
      <Text style={styles.methodsSummaryRoute} numberOfLines={1}>
        {order.origin} → {order.destination}
      </Text>
      <View style={styles.methodsSummaryFooter}>
        <Text style={styles.methodsSummaryAmount}>{formatSupplierMoney(order.amount)}</Text>
        <Text style={styles.methodsSummaryHint}>Due now</Text>
      </View>
    </Animated.View>
  );
}

function formatPickupLabel(value: string) {
  if (!value || value === "Schedule pending") return "To be scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function ConfirmDetailRow({
  icon,
  imageIcon,
  label,
  value,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  imageIcon?: ImageSourcePropType;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.confirmRow}>
      <View style={styles.confirmRowIcon}>
        {imageIcon ? (
          <Image source={imageIcon} style={styles.confirmRowImageIcon} />
        ) : (
          <Ionicons name={icon || "card-outline"} size={16} color={colors.ink} />
        )}
      </View>
      <View style={styles.confirmRowCopy}>
        <Text style={styles.confirmRowLabel}>{label}</Text>
        <Text style={styles.confirmRowValue}>{value}</Text>
      </View>
    </View>
  );
}

function PaymentConfirmPanel({
  order,
  cardBrand,
  cardName,
  cardNumber,
  cardMasked,
  walletMethod,
  processing,
  slideKey,
  onConfirm,
}: {
  order: SupplierCheckoutOrder;
  cardBrand: string;
  cardName: string;
  cardNumber: string;
  cardMasked?: string;
  walletMethod?: "google-pay" | "apple-pay" | null;
  processing: boolean;
  slideKey: number;
  onConfirm: () => void;
}) {
  const digits = cardNumber.replace(/\s/g, "");
  const maskedCard =
    cardMasked || (digits.length >= 4 ? `•••• ${digits.slice(-4)}` : "•••• ••••");
  const walletLabel = walletMethod === "google-pay" ? "Google Pay" : "Apple Pay";
  const walletUsesGoogleIcon = walletMethod === "google-pay";

  return (
    <Animated.View
      key="confirm-step"
      entering={SlideInRight.duration(420).easing(Easing.out(Easing.cubic))}
      exiting={SlideOutLeft.duration(280)}
      style={styles.confirmWrap}
    >
      <Animated.View entering={FadeInDown.delay(80).duration(480)} style={styles.confirmHero}>
        <LinearGradient
          colors={["#FFFFFF", "#F8FAFC"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.confirmHeroGradient}
        >
          <View style={styles.confirmHeroTop}>
            <View style={styles.summaryBadge}>
              <UkFlag size={16} />
              <Text style={styles.summaryBadgeText}>Load checkout</Text>
            </View>
            <Text style={styles.summaryCode}>{order.loadCode}</Text>
          </View>
          <Text style={styles.confirmRoute}>
            {order.origin} → {order.destination}
          </Text>
          <Text style={styles.confirmAmount}>{formatSupplierMoney(order.amount)}</Text>
          <Text style={styles.confirmAmountHint}>Total payment due</Text>
        </LinearGradient>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(160).duration(480)} style={styles.confirmDetailsCard}>
        <Text style={styles.confirmSectionTitle}>Shipment details</Text>
        <ConfirmDetailRow icon="cube-outline" label="Equipment" value={order.equipment} />
        <ConfirmDetailRow
          icon="calendar-outline"
          label="Pickup"
          value={formatPickupLabel(order.pickupDate)}
        />
        <ConfirmDetailRow icon="navigate-outline" label="Route status" value="Awaiting payment" />
        <View style={styles.confirmDivider} />
        <Text style={styles.confirmSectionTitle}>Payment method</Text>
        {walletMethod ? (
          <>
            <ConfirmDetailRow
              icon={walletUsesGoogleIcon ? undefined : "logo-apple"}
              imageIcon={walletUsesGoogleIcon ? GOOGLE_PAY_ICON : undefined}
              label={walletLabel}
              value="Secure wallet checkout"
            />
            <ConfirmDetailRow
              icon="shield-checkmark-outline"
              label="Protection"
              value="Encrypted by Stripe"
            />
          </>
        ) : (
          <>
            <ConfirmDetailRow
              icon="card-outline"
              label={`${cardBrand || "Debit or Credit"} card`}
              value={maskedCard}
            />
            <ConfirmDetailRow icon="person-outline" label="Cardholder" value={cardName.trim()} />
          </>
        )}
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(280).duration(480)} style={styles.confirmSlideWrap}>
        <Text style={styles.confirmSlideHint}>
          {walletMethod
            ? `Swipe to review your load, then ${walletLabel} will open to approve the payment.`
            : "Swipe to confirm and publish your load on the marketplace."}
        </Text>
        <SlideToConfirm
          key={slideKey}
          label={
            processing
              ? walletMethod
                ? "Opening wallet…"
                : "Processing payment…"
              : walletMethod
                ? `Swipe to pay with ${walletLabel}`
                : "Swipe to confirm payment"
          }
          disabled={processing}
          onConfirm={onConfirm}
        />
      </Animated.View>
    </Animated.View>
  );
}

function PaymentFormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  maxLength,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "number-pad";
  maxLength?: number;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedLight}
        style={styles.fieldInput}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

export default function SupplierCompletePaymentScreen() {
  const { loadId } = useLocalSearchParams<{ loadId?: string }>();
  const stripe = useStripe();
  const platformPay = usePlatformPay();
  const stripeLive = isLiveStripeEnabled();
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<CheckoutStep>("methods");
  const [order, setOrder] = useState<SupplierCheckoutOrder | null>(null);
  const [supplierId, setSupplierId] = useState("");
  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [slideKey, setSlideKey] = useState(0);
  const [paymentPhase, setPaymentPhase] = useState<PaymentOverlayPhase | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [cardComplete, setCardComplete] = useState(false);
  const [stripePaymentMethodId, setStripePaymentMethodId] = useState("");
  const [stripeCardBrand, setStripeCardBrand] = useState("Card");
  const [stripeCardLast4, setStripeCardLast4] = useState("****");
  const [preparingCard, setPreparingCard] = useState(false);
  const [submittingBankTransfer, setSubmittingBankTransfer] = useState(false);
  const [selectedWalletMethod, setSelectedWalletMethod] = useState<"google-pay" | "apple-pay" | null>(
    null
  );

  const visibleMethods = useMemo(
    () =>
      PAYMENT_METHODS.filter(
        (method) =>
          !method.platforms || method.platforms.includes(Platform.OS as "ios" | "android")
      ),
    []
  );

  const cardBrand = stripeCardBrand;

  const loadCheckout = useCallback(async () => {
    if (!loadId) {
      router.replace("/(supplier-main)/posts");
      return;
    }

    setLoading(true);
    const result = await fetchSupplierCheckoutOrder(String(loadId));
    if (!result) {
      router.replace("/login");
      return;
    }

    setOrder(result.order);
    setSupplierId(result.supplierId);
    setUserEmail(result.userEmail);

    if (result.order.paymentState === "paid") {
      setStep("success");
    }

    setLoading(false);
  }, [loadId]);

  useEffect(() => {
    void loadCheckout();
  }, [loadCheckout]);

  const invalidateCaches = useCallback(async () => {
    setCachedSupplierMyPosts(null);
    setCachedSupplierDashboard(null);
    await prefetchSupplierMyPosts(true);
  }, []);

  const handlePlatformPay = useCallback(async () => {
    if (!order || !supplierId || processing) return;

    if (!stripeLive) {
      setFlashMessage("Wallet payments need a native app build with Stripe keys configured.");
      return;
    }

    setProcessing(true);
    setPaymentError(null);
    setFlashMessage(null);

    const result = await processSupplierPlatformPayment({
      platformPay,
      supplierId,
      loadId: order.loadId,
      loadTitle: order.title,
      amount: order.amount,
    });

    setProcessing(false);

    if (!result.ok) {
      const message = "error" in result ? result.error : "Payment could not be completed.";
      setFlashMessage(message);
      setSlideKey((value) => value + 1);
      return;
    }

    void invalidateCaches();
    setPaymentPhase("success");
  }, [invalidateCaches, order, platformPay, processing, stripeLive, supplierId]);

  const handleMethodSelect = useCallback(
    (method: PaymentMethodId) => {
      setFlashMessage(null);
      if (method === "card") {
        setStep("card");
        return;
      }
      if (method === "bank-transfer") {
        setStep("bank-transfer");
        return;
      }
      if (method === "apple-pay" || method === "google-pay") {
        setSelectedWalletMethod(method);
        setStripePaymentMethodId("");
        setStep("confirm");
        return;
      }
    },
    []
  );

  const handleBankTransferConfirm = useCallback(async () => {
    if (!order || !supplierId || submittingBankTransfer) return;

    setSubmittingBankTransfer(true);
    setFlashMessage(null);

    const result = await submitSupplierBankTransferRequest({
      loadId: order.loadId,
      supplierId,
      amount: order.amount,
      paymentFor: order.title,
      title: order.title,
      origin: order.origin,
      destination: order.destination,
      equipment: order.equipment,
      supplierEmail: userEmail,
    });

    setSubmittingBankTransfer(false);

    if (!result.ok) {
      setFlashMessage(result.error);
      return;
    }

    void invalidateCaches();
    setStep("bank-submitted");
  }, [invalidateCaches, order, submittingBankTransfer, supplierId, userEmail]);

  const handleContinueToConfirm = useCallback(async () => {
    if (!stripeLive || !stripe) {
      setFlashMessage(
        "Live Stripe checkout requires the Alpha Freight app build. Payments are processed through alpha-freight-server.onrender.com."
      );
      return;
    }

    if (!cardName.trim() || !cardComplete) {
      setFlashMessage("Please complete all card details.");
      return;
    }

    setPreparingCard(true);
    setFlashMessage(null);

    const prepared = await createSupplierStripePaymentMethod({
      stripe,
      cardName,
      userEmail,
      country: "GB",
    });

    setPreparingCard(false);

    if (!prepared.ok) {
      setFlashMessage(prepared.error);
      return;
    }

    setStripePaymentMethodId(prepared.paymentMethodId);
    setStripeCardBrand(prepared.cardBrand);
    setStripeCardLast4(prepared.cardLast4);
    setCardNumber(`•••• •••• •••• ${prepared.cardLast4}`);
    setSelectedWalletMethod(null);
    setStep("confirm");
  }, [cardComplete, cardName, stripe, stripeLive, userEmail]);

  const handlePayWithCard = useCallback(async () => {
    if (!order || !supplierId || processing) return;

    if (!stripeLive || !stripe || !stripePaymentMethodId) {
      setPaymentError("Secure checkout is not ready. Go back and enter your card again.");
      setPaymentPhase("failed");
      return;
    }

    setPaymentPhase("processing");
    setProcessing(true);
    setPaymentError(null);
    setFlashMessage(null);

    const result = await confirmSupplierStripePayment({
      stripe,
      supplierId,
      loadId: order.loadId,
      loadTitle: order.title,
      amount: order.amount,
      paymentMethodId: stripePaymentMethodId,
      cardBrand: stripeCardBrand,
      cardLast4: stripeCardLast4,
    });

    await new Promise<void>((resolve) => {
      setTimeout(resolve, 750);
    });

    setProcessing(false);

    if (!result.ok) {
      setPaymentError("error" in result ? result.error : "Payment could not be completed.");
      setPaymentPhase("failed");
      return;
    }

    void invalidateCaches();
    setPaymentPhase("success");
  }, [
    invalidateCaches,
    order,
    processing,
    stripe,
    stripeCardBrand,
    stripeCardLast4,
    stripeLive,
    stripePaymentMethodId,
    supplierId,
  ]);

  const handlePaymentSuccessFinish = useCallback(() => {
    setPaymentPhase(null);
    setStep("success");
  }, []);

  const handlePaymentRetry = useCallback(() => {
    setPaymentPhase(null);
    setPaymentError(null);
    setSlideKey((value) => value + 1);
  }, []);

  const handleDone = useCallback(() => {
    router.replace("/(supplier-main)/posts");
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator size="large" color={colors.ink} />
        <Text style={styles.loadingText}>Preparing secure checkout…</Text>
      </View>
    );
  }

  if (!order) return null;

  const pageTitle =
    step === "methods"
      ? "Choose payment"
      : step === "card"
        ? "Debit or Credit"
        : step === "bank-transfer"
          ? "Bank Transfer"
          : step === "bank-submitted"
            ? "Verification pending"
            : "Review & confirm";

  const pageSubtitle =
    step === "methods"
      ? "Select how you want to publish this load."
      : step === "card"
        ? "Enter secure card details below."
        : step === "bank-transfer"
          ? "Send payment to our GBP account, then confirm below."
          : step === "bank-submitted"
            ? "Our team is checking your transfer."
            : "Check everything before you pay.";

  const handleBack = () => {
    if (processing || paymentPhase) return;
    if (step === "confirm") {
      if (selectedWalletMethod) {
        setSelectedWalletMethod(null);
        setStep("methods");
      } else {
        setStripePaymentMethodId("");
        setStep("card");
      }
      setFlashMessage(null);
      return;
    }
    if (step === "card") {
      setStep("methods");
      setFlashMessage(null);
      return;
    }
    if (step === "bank-transfer") {
      setStep("methods");
      setFlashMessage(null);
      return;
    }
    router.back();
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <LinearGradient
        colors={["#FFFFFF", "#FAFBFC", "#FFFFFF"]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <AmbientBackground />

      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        {step === "success" || step === "bank-submitted" ? (
          <Animated.View entering={FadeIn.duration(420)} style={styles.successWrap}>
            {step === "success" ? <ConfettiPop delay={40} /> : null}
            <Animated.View entering={ZoomIn.delay(120).duration(560).springify()} style={styles.successIcon}>
              <Ionicons
                name={step === "bank-submitted" ? "time-outline" : "checkmark"}
                size={42}
                color={colors.ink}
              />
            </Animated.View>
            <Animated.Text entering={FadeInUp.delay(180).duration(420)} style={styles.successEyebrow}>
              {step === "bank-submitted" ? "Transfer submitted" : "Payment confirmed"}
            </Animated.Text>
            <Animated.Text entering={FadeInUp.delay(240).duration(420)} style={styles.successTitle}>
              {step === "bank-submitted" ? "Waiting for admin verification" : "Your load is now live"}
            </Animated.Text>
            <Animated.Text entering={FadeInUp.delay(300).duration(420)} style={styles.successSub}>
              {step === "bank-submitted"
                ? `${formatSupplierMoney(order.amount)} bank transfer for ${order.loadCode} is pending. Our team will verify within 2 hours on business days. Your load goes live after confirmation.`
                : `${formatSupplierMoney(order.amount)} paid for ${order.loadCode}. Carriers can now see this route on the marketplace.`}
            </Animated.Text>
            <Animated.View entering={FadeInDown.delay(360).duration(420)} style={styles.successActions}>
              <Pressable
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                onPress={handleDone}
              >
                <Text style={styles.primaryBtnText}>View my posts</Text>
                <Ionicons name="arrow-forward" size={18} color={colors.ink} />
              </Pressable>
            </Animated.View>
          </Animated.View>
        ) : (
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
            </View>

            <Animated.Text
              key={`title-${step}`}
              entering={FadeIn.duration(360).easing(Easing.out(Easing.cubic))}
              exiting={FadeOut.duration(200)}
              style={styles.pageTitle}
            >
              {pageTitle}
            </Animated.Text>
            {step !== "success" && step !== "bank-submitted" ? (
              <Animated.Text
                key={`subtitle-${step}`}
                entering={FadeIn.duration(320)}
                exiting={FadeOut.duration(180)}
                style={styles.pageSubtitle}
              >
                {pageSubtitle}
              </Animated.Text>
            ) : null}

            <ScrollView
              style={styles.flex}
              contentContainerStyle={[
                styles.scrollContent,
                step === "methods" && styles.scrollContentMethods,
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {flashMessage ? (
                <Animated.View
                  entering={FadeInUp.duration(320).easing(Easing.out(Easing.cubic))}
                  exiting={FadeOut.duration(180)}
                  style={styles.flashBanner}
                >
                  <Ionicons
                    name={flashMessage.includes("coming soon") ? "information-circle-outline" : "alert-circle-outline"}
                    size={18}
                    color={colors.ink}
                  />
                  <Text style={styles.flashText}>{flashMessage}</Text>
                </Animated.View>
              ) : null}

              {step === "methods" ? (
                <Animated.View
                  key="methods-step"
                  entering={FadeIn.duration(280)}
                  exiting={FadeOut.duration(180)}
                  style={styles.methodsWrap}
                >
                  <PaymentMethodsSummary order={order} />

                  <Text style={styles.methodsSectionLabel}>Payment methods</Text>

                  {visibleMethods.map((method, index) => (
                    <MethodCard
                      key={method.id}
                      option={method}
                      index={index}
                      recommended={method.id === "card"}
                      onPress={() => handleMethodSelect(method.id)}
                    />
                  ))}

                  <Animated.View
                    entering={FadeInUp.delay(480).duration(480).easing(Easing.out(Easing.cubic))}
                    style={styles.termsBlock}
                  >
                    <View style={styles.stripeTrustCard}>
                      <Ionicons name="shield-checkmark-outline" size={16} color={colors.ink} />
                      <Text style={styles.stripeTrustText}>
                        Marketplace payment · cancel before carrier assignment · secured by Stripe
                      </Text>
                    </View>
                  </Animated.View>

                  <Animated.View entering={FadeInUp.delay(560).duration(480).easing(Easing.out(Easing.cubic))}>
                    <Pressable
                      style={({ pressed }) => [styles.helpCard, pressed && styles.pressedSoft]}
                      onPress={() => router.push("/support")}
                    >
                      <View style={styles.helpIcon}>
                        <Ionicons name="help-circle-outline" size={18} color={colors.ink} />
                      </View>
                      <Text style={styles.helpText}>Need help with checkout?</Text>
                      <Ionicons name="chevron-forward" size={16} color={colors.mutedLight} />
                    </Pressable>
                  </Animated.View>
                </Animated.View>
              ) : step === "card" ? (
                <Animated.View
                  key="card-step"
                  entering={SlideInRight.duration(420).easing(Easing.out(Easing.cubic))}
                  exiting={SlideOutLeft.duration(280)}
                  style={styles.cardFormWrap}
                >
                  <View style={styles.cardPreview}>
                    <LinearGradient
                      colors={[colors.premiumGreen, colors.premiumGreenDark]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.cardPreviewGradient}
                    >
                      <Text style={styles.cardPreviewBrand}>{cardBrand || "ALPHA FREIGHT"}</Text>
                      <Text style={styles.cardPreviewNumber}>
                        {cardNumber.trim() || "•••• •••• •••• ••••"}
                      </Text>
                      <View style={styles.cardPreviewFooter}>
                        <View>
                          <Text style={styles.cardPreviewLabel}>CARDHOLDER</Text>
                          <Text style={styles.cardPreviewValue}>{cardName.trim() || "YOUR NAME"}</Text>
                        </View>
                        <View>
                          <Text style={styles.cardPreviewLabel}>EXPIRES</Text>
                          <Text style={styles.cardPreviewValue}>{expiry.trim() || "MM/YY"}</Text>
                        </View>
                      </View>
                    </LinearGradient>
                  </View>

                  <View style={styles.formCard}>
                    <PaymentFormField
                      label="Name on card"
                      value={cardName}
                      onChangeText={setCardName}
                      placeholder="Full name"
                    />
                    {stripeLive ? (
                      <View style={styles.stripeCardFieldWrap}>
                        <Text style={styles.fieldLabel}>Debit or credit card</Text>
                        <CardField
                          postalCodeEnabled={false}
                          placeholders={{ number: "4242 4242 4242 4242" }}
                          cardStyle={{
                            backgroundColor: colors.white,
                            textColor: colors.ink,
                            placeholderColor: colors.mutedLight,
                            borderColor: colors.border,
                            borderWidth: 1,
                            borderRadius: radius.lg,
                            fontSize: 16,
                          }}
                          style={styles.stripeCardField}
                          onCardChange={(details) => {
                            setCardComplete(Boolean(details.complete));
                            if (details.brand && details.last4) {
                              setStripeCardBrand(
                                details.brand.charAt(0).toUpperCase() + details.brand.slice(1)
                              );
                              setStripeCardLast4(details.last4);
                            }
                          }}
                        />
                      </View>
                    ) : (
                      <View style={styles.liveOnlyBanner}>
                        <Ionicons name="lock-closed-outline" size={18} color={colors.ink} />
                        <Text style={styles.liveOnlyText}>
                          Real card payments run through the same Stripe system as the web supplier Pay Now
                          page. Use the Alpha Freight dev/production app build — not Expo Go.
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.secureNote}>
                    Debit and credit cards are accepted. Your card details are encrypted and never stored on device.
                  </Text>

                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryBtn,
                      styles.payBtn,
                      pressed && styles.pressed,
                      (!stripeLive || preparingCard) && styles.btnDisabled,
                    ]}
                    disabled={!stripeLive || preparingCard}
                    onPress={() => void handleContinueToConfirm()}
                  >
                    {preparingCard ? (
                      <ActivityIndicator color={colors.ink} />
                    ) : (
                      <>
                        <Text style={styles.primaryBtnText}>Continue to review</Text>
                        <Ionicons name="arrow-forward" size={18} color={colors.ink} />
                      </>
                    )}
                  </Pressable>
                </Animated.View>
              ) : step === "bank-transfer" ? (
                <Animated.View
                  key="bank-transfer-step"
                  entering={SlideInRight.duration(420).easing(Easing.out(Easing.cubic))}
                  exiting={SlideOutLeft.duration(280)}
                >
                  <SupplierBankTransferPanel
                    amount={order.amount}
                    loadId={order.loadId}
                    loadCode={order.loadCode}
                    submitting={submittingBankTransfer}
                    onConfirm={() => void handleBankTransferConfirm()}
                  />
                </Animated.View>
              ) : (
                <PaymentConfirmPanel
                  order={order}
                  cardBrand={cardBrand}
                  cardName={cardName}
                  cardNumber={cardNumber}
                  walletMethod={selectedWalletMethod}
                  processing={processing}
                  slideKey={slideKey}
                  onConfirm={() =>
                    void (selectedWalletMethod ? handlePlatformPay() : handlePayWithCard())
                  }
                />
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>

      <PaymentStatusOverlay
        visible={paymentPhase !== null}
        phase={paymentPhase ?? "processing"}
        amountLabel={formatSupplierMoney(order.amount)}
        errorMessage={paymentError ?? undefined}
        onSuccessFinish={handlePaymentSuccessFinish}
        onRetry={handlePaymentRetry}
      />
    </GestureHandlerRootView>
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
  loadingRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: colors.white,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.muted,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 4,
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
  },
  pageSubtitle: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "500",
    color: colors.muted,
    lineHeight: 18,
    paddingHorizontal: spacing.xl,
    paddingTop: 6,
    paddingBottom: spacing.md,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  scrollContentMethods: {
    paddingTop: 0,
    gap: 10,
  },
  confirmWrap: {
    gap: spacing.md,
  },
  confirmHero: {
    borderRadius: radius.xl,
    overflow: "hidden",
    ...shadow.soft,
  },
  confirmHeroGradient: {
    padding: spacing.lg,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
  },
  confirmHeroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  confirmRoute: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.ink,
    lineHeight: 28,
  },
  confirmAmount: {
    fontSize: 34,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.8,
    marginTop: 4,
  },
  confirmAmountHint: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
  },
  confirmDetailsCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: spacing.md,
    gap: 12,
    ...shadow.soft,
  },
  confirmSectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: colors.muted,
    marginBottom: 2,
  },
  confirmRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  confirmRowIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.canvasMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmRowImageIcon: {
    width: 18,
    height: 18,
    resizeMode: "contain",
  },
  confirmRowCopy: {
    flex: 1,
    gap: 2,
  },
  confirmRowLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.mutedLight,
  },
  confirmRowValue: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
  },
  confirmDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  confirmSlideWrap: {
    gap: 12,
    marginTop: 4,
  },
  confirmSlideHint: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
    textAlign: "center",
    lineHeight: 19,
    paddingHorizontal: 8,
  },
  summaryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.brandSoft,
  },
  summaryBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.ink,
  },
  summaryCode: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.mutedLight,
  },
  methodsWrap: { gap: 10 },
  methodsSummaryCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: spacing.md,
    gap: 8,
    ...shadow.soft,
  },
  methodsSummaryTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  methodsSummaryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.brandSoft,
  },
  methodsSummaryBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: colors.ink,
  },
  methodsSummaryCode: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.mutedLight,
  },
  methodsSummaryRoute: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
  },
  methodsSummaryFooter: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginTop: 2,
  },
  methodsSummaryAmount: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.6,
  },
  methodsSummaryHint: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.muted,
  },
  methodsSectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: colors.mutedLight,
    paddingHorizontal: 4,
    marginTop: 4,
    marginBottom: 2,
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 62,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.soft,
  },
  methodCardFeatured: {
    borderColor: "rgba(191, 255, 7, 0.55)",
    backgroundColor: "#FCFEF5",
  },
  methodIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.9)",
  },
  methodImageIcon: {
    width: 22,
    height: 22,
    resizeMode: "contain",
  },
  methodCopy: {
    flex: 1,
    gap: 2,
    paddingRight: 2,
  },
  methodLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  methodLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.2,
  },
  methodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    borderWidth: 1,
    borderColor: colors.ink,
  },
  methodBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    color: colors.ink,
  },
  methodHint: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.muted,
  },
  methodArrow: {
    width: 32,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  methodArrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.canvasMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  termsBlock: {
    marginTop: 4,
  },
  stripeTrustCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: colors.canvasMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stripeTrustText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "500",
    color: colors.muted,
  },
  helpCard: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  helpIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.canvasMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.1,
  },
  flashBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radius.md,
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
  cardFormWrap: { gap: spacing.md },
  cardPreview: {
    borderRadius: radius.xl,
    overflow: "hidden",
    ...shadow.card,
  },
  cardPreviewGradient: {
    minHeight: 190,
    padding: spacing.lg,
    justifyContent: "space-between",
  },
  cardPreviewBrand: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.82)",
  },
  cardPreviewNumber: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 2,
    color: colors.white,
  },
  cardPreviewFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  cardPreviewLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    color: "rgba(255,255,255,0.55)",
    marginBottom: 4,
  },
  cardPreviewValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.white,
  },
  formCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: spacing.md,
    gap: 14,
    ...shadow.soft,
  },
  stripeCardFieldWrap: {
    gap: 8,
  },
  stripeCardField: {
    width: "100%",
    height: 52,
  },
  liveOnlyBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#F8FAFC",
    padding: spacing.md,
  },
  liveOnlyText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
  },
  btnDisabled: {
    opacity: 0.55,
  },
  field: { gap: 8 },
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
    borderRadius: radius.md,
    backgroundColor: colors.inputFill,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: "600",
    color: colors.ink,
  },
  splitField: { flex: 1 },
  secureNote: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "500",
    color: colors.mutedLight,
    textAlign: "center",
    paddingHorizontal: 8,
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
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  payBtn: {
    marginTop: 4,
  },
  payBtnDisabled: {
    opacity: 0.72,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.ink,
  },
  successWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    gap: 12,
  },
  successIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.brand,
    borderWidth: 2,
    borderColor: colors.ink,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.card,
  },
  successEyebrow: {
    marginTop: spacing.md,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.muted,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.ink,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  successSub: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.muted,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
  },
  successActions: {
    width: "100%",
    marginTop: spacing.lg,
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
