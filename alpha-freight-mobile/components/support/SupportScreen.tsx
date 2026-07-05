import { useMemo, useState } from "react";
import {
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  SUPPORT_EMAIL,
  SUPPORT_HOURS,
  SUPPORT_PHONE,
  callSupport,
  emailSupport,
} from "@/lib/load-actions";
import { colors, radius, spacing } from "@/lib/theme";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQS = [
  {
    q: "How do I bid on a load?",
    a: "Open Available Loads, select a paid live shipment, and submit your offer. Track responses on My Bids.",
    tags: ["bid", "marketplace", "loads"],
  },
  {
    q: "How do I withdraw my earnings?",
    a: "Go to Wallet and set up your payout method. Withdrawals typically arrive within 1–2 business days once verified.",
    tags: ["wallet", "earnings", "payout"],
  },
  {
    q: "How do I update load status?",
    a: "Open My Loads, select your assigned shipment, and progress through booked → in-transit → delivered.",
    tags: ["my loads", "status"],
  },
  {
    q: "How does the referral programme work?",
    a: "Share your link from Referrals. When a new carrier completes 5 loads, you earn £50 wallet credit.",
    tags: ["referral", "rewards"],
  },
  {
    q: "Who do I contact for payment issues?",
    a: `Email ${SUPPORT_EMAIL} with your load reference and company name. Never share card details by email.`,
    tags: ["billing", "payment"],
  },
];

const QUICK_LINKS = [
  { label: "Available loads", icon: "bus-outline" as const, route: "/(main)/loads" },
  { label: "My loads", icon: "layers-outline" as const, route: "/my-loads" },
  { label: "My bids", icon: "hammer-outline" as const, route: "/my-bids" },
  { label: "Wallet", icon: "wallet-outline" as const, route: "/(main)/wallet" },
];

export default function SupportScreen() {
  const [search, setSearch] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const filteredFaqs = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return FAQS;
    return FAQS.filter(
      (faq) =>
        faq.q.toLowerCase().includes(term) ||
        faq.a.toLowerCase().includes(term) ||
        faq.tags.some((tag) => tag.includes(term))
    );
  }, [search]);

  const toggleFaq = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenFaq((current) => (current === index ? null : index));
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeTop} edges={["top"]}>
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.ink} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerEyebrow}>HELP CENTRE</Text>
            <Text style={styles.pageTitle}>Support</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.headerDivider} />
        <Text style={styles.pageSub}>Answers, contact options, and quick links</Text>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={18} color={colors.muted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search help topics"
              placeholderTextColor={colors.mutedLight}
              style={styles.searchInput}
            />
          </View>

          <View style={styles.contactCard}>
            <Text style={styles.sectionTitle}>Contact us</Text>
            <Pressable
              style={({ pressed }) => [styles.contactRow, pressed && styles.pressed]}
              onPress={() => void callSupport()}
            >
              <View style={styles.contactIcon}>
                <Ionicons name="call-outline" size={18} color={colors.ink} />
              </View>
              <View style={styles.contactCopy}>
                <Text style={styles.contactLabel}>Phone</Text>
                <Text style={styles.contactValue}>{SUPPORT_PHONE}</Text>
                <Text style={styles.contactHint}>{SUPPORT_HOURS}</Text>
              </View>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.contactRow, pressed && styles.pressed]}
              onPress={() => void emailSupport("Alpha Freight carrier support")}
            >
              <View style={styles.contactIcon}>
                <Ionicons name="mail-outline" size={18} color={colors.ink} />
              </View>
              <View style={styles.contactCopy}>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>{SUPPORT_EMAIL}</Text>
              </View>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>Quick links</Text>
          <View style={styles.linksGrid}>
            {QUICK_LINKS.map((link) => (
              <Pressable
                key={link.label}
                style={({ pressed }) => [styles.linkTile, pressed && styles.pressed]}
                onPress={() => router.push(link.route as never)}
              >
                <Ionicons name={link.icon} size={20} color={colors.ink} />
                <Text style={styles.linkLabel}>{link.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.sectionTitle}>FAQs</Text>
          {filteredFaqs.length ? (
            filteredFaqs.map((faq, index) => {
              const open = openFaq === index;
              return (
                <Pressable
                  key={faq.q}
                  style={styles.faqCard}
                  onPress={() => toggleFaq(index)}
                >
                  <View style={styles.faqHeader}>
                    <Text style={styles.faqQuestion}>{faq.q}</Text>
                    <Ionicons
                      name={open ? "chevron-up" : "chevron-down"}
                      size={18}
                      color={colors.muted}
                    />
                  </View>
                  {open ? <Text style={styles.faqAnswer}>{faq.a}</Text> : null}
                </Pressable>
              );
            })
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No FAQs match your search.</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  safeTop: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.canvas,
  },
  headerCenter: { flex: 1 },
  headerSpacer: { width: 40 },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: colors.mutedLight,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: colors.ink,
  },
  headerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  pageSub: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.muted,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.inputFill,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: colors.ink,
    padding: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.3,
  },
  contactCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    gap: 0,
  },
  contactRow: {
    flexDirection: "row",
    gap: 12,
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  contactCopy: { flex: 1, gap: 2 },
  contactLabel: { fontSize: 12, fontWeight: "600", color: colors.muted },
  contactValue: { fontSize: 15, fontWeight: "700", color: colors.ink },
  contactHint: { fontSize: 12, fontWeight: "500", color: colors.mutedLight },
  linksGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  linkTile: {
    width: "48%",
    flexGrow: 1,
    backgroundColor: colors.canvas,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 8,
  },
  linkLabel: { fontSize: 14, fontWeight: "700", color: colors.ink },
  faqCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 8,
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
    lineHeight: 21,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "500",
    color: colors.muted,
  },
  emptyCard: {
    padding: spacing.lg,
    backgroundColor: colors.canvas,
    borderRadius: radius.lg,
    alignItems: "center",
  },
  emptyText: { fontSize: 14, fontWeight: "600", color: colors.muted },
  pressed: { opacity: 0.85 },
});
