import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import SetupShell, { SetupOutlineButton, SetupPrimaryButton } from "@/components/account-setup/SetupShell";
import { SetupFormField, SetupStaticField, SetupStepHeader } from "@/components/account-setup/SetupFormField";
import UkFlag from "@/components/ui/UkFlag";
import { saveAccountSetup, isAccountSetupComplete } from "@/lib/account-setup";
import { uploadIdentityDocument } from "@/lib/account-setup-upload";
import {
  ACCOUNT_USE_OPTIONS,
  ANNUAL_REVENUE_OPTIONS,
  IDENTITY_DOCUMENTS,
  UK_ADDRESS_SUGGESTIONS,
  type AccountSetupDraft,
  type AccountType,
  type IdentityDocument,
} from "@/lib/account-setup-types";
import { clearCachedCarrierProfile } from "@/lib/carrier-profile-cache";
import { setCachedCarrierDashboard } from "@/lib/carrier-dashboard-cache";
import { routeAfterAccountSetup } from "@/lib/pin-routing";
import { colors, radius, spacing } from "@/lib/theme";

type SetupStep =
  | "requirements"
  | "phone"
  | "account-type"
  | "address-intro"
  | "address-search"
  | "address-manual"
  | "documents"
  | "document-upload"
  | "question-1"
  | "question-2"
  | "processing";

const STEP_ORDER: SetupStep[] = [
  "requirements",
  "phone",
  "account-type",
  "address-intro",
  "address-search",
  "documents",
  "document-upload",
  "question-1",
  "question-2",
  "processing",
];

const REQUIREMENTS_ID_ICON = require("@/assets/account-setup/requirements-id.png");
const REQUIREMENTS_HOME_ICON = require("@/assets/account-setup/requirements-home.png");

function RequirementRow({
  icon,
  title,
  children,
}: {
  icon: ImageSourcePropType;
  title: string;
  children?: ReactNode;
}) {
  return (
    <View style={styles.requirementBlock}>
      <View style={styles.requirementHeader}>
        <View style={styles.requirementIconSlot}>
          <Image source={icon} style={styles.requirementIcon} resizeMode="contain" />
        </View>
        <Text style={styles.requirementTitle}>{title}</Text>
      </View>
      {children ? <View style={styles.requirementDetails}>{children}</View> : null}
    </View>
  );
}


function AccountTypeCard({
  label,
  sub,
  icon,
  selected,
  onPress,
}: {
  label: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.typeCard,
        selected && styles.typeCardSelected,
        pressed && styles.pressedLight,
      ]}
      onPress={onPress}
    >
      <View style={[styles.typeIconWrap, selected && styles.typeIconWrapSelected]}>
        <Ionicons name={icon} size={24} color={colors.ink} />
      </View>
      <View style={styles.typeCopy}>
        <Text style={styles.typeLabel}>{label}</Text>
        <Text style={styles.typeSub}>{sub}</Text>
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
    </Pressable>
  );
}

function SelectRow({
  label,
  selected,
  multi,
  onPress,
}: {
  label: string;
  selected: boolean;
  multi?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.selectRow, pressed && styles.pressedLight]} onPress={onPress}>
      <Text style={styles.selectLabel}>{label}</Text>
      <View style={[multi ? styles.checkbox : styles.radio, selected && (multi ? styles.checkboxSelected : styles.radioSelected)]}>
        {selected ? (
          multi ? (
            <Ionicons name="checkmark" size={14} color={colors.white} />
          ) : (
            <View style={styles.radioDot} />
          )
        ) : null}
      </View>
    </Pressable>
  );
}

export default function AccountSetupScreen() {
  const [step, setStep] = useState<SetupStep>("requirements");
  const [draft, setDraft] = useState<AccountSetupDraft>({
    accountType: null,
    countryCode: "+44",
    phone: "",
    street: "",
    houseNumber: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    postcode: "",
    countyState: "",
    identityDocument: null,
    identityDocumentLocalUri: null,
    identityDocumentUrl: null,
    identityDocumentFileName: null,
    accountUses: [],
    annualRevenue: "",
  });
  const [addressQuery, setAddressQuery] = useState("");
  const [processingDone, setProcessingDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      if (await isAccountSetupComplete()) {
        await routeAfterAccountSetup();
      }
    })();
  }, []);

  const goBack = useCallback(() => {
    if (step === "address-manual") {
      setStep("address-search");
      return;
    }
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]);
  }, [step]);

  const goNext = useCallback((next: SetupStep) => {
    setError(null);
    setStep(next);
  }, []);

  const selectedDocumentLabel = useMemo(() => {
    if (!draft.identityDocument) return "identity document";
    return IDENTITY_DOCUMENTS.find((doc) => doc.id === draft.identityDocument)?.label ?? "identity document";
  }, [draft.identityDocument]);

  const pickIdentityDocument = useCallback(async (fromCamera: boolean) => {
    setError(null);

    const permission = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setError(fromCamera ? "Camera permission is required to take a photo." : "Gallery permission is required to upload.");
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          quality: 0.85,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          quality: 0.85,
        });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setDraft((prev) => ({
      ...prev,
      identityDocumentLocalUri: asset.uri,
      identityDocumentFileName: asset.fileName ?? `${prev.identityDocument ?? "identity"}.jpg`,
      identityDocumentUrl: null,
    }));
  }, []);

  const handleDocumentUploadContinue = useCallback(async () => {
    if (!draft.identityDocument || !draft.identityDocumentLocalUri) return;

    setUploadingDocument(true);
    setError(null);

    try {
      const uploadedUrl =
        draft.identityDocumentUrl ||
        (await uploadIdentityDocument(
          draft.identityDocumentLocalUri,
          draft.identityDocument,
          draft.identityDocumentFileName
        ));

      setDraft((prev) => ({ ...prev, identityDocumentUrl: uploadedUrl }));
      goNext("question-1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload document. Try again.");
    } finally {
      setUploadingDocument(false);
    }
  }, [draft, goNext]);

  const addressSuggestions = useMemo(() => {
    const q = addressQuery.trim().toUpperCase().replace(/\s+/g, " ");
    if (q.length < 2) return [];
    return UK_ADDRESS_SUGGESTIONS.filter(
      (item) =>
        item.postcode.toUpperCase().includes(q) ||
        item.city.toUpperCase().includes(q) ||
        item.line1.toUpperCase().includes(q)
    );
  }, [addressQuery]);

  const questionProgress = step === "question-1" ? "Question 1 of 2" : step === "question-2" ? "Question 2 of 2" : undefined;

  const addressTitle =
    draft.accountType === "company"
      ? "What's your business address?"
      : "What's your current home address?";

  const selectAddress = (item: (typeof UK_ADDRESS_SUGGESTIONS)[number]) => {
    setDraft((prev) => ({
      ...prev,
      street: item.line1,
      houseNumber: "",
      addressLine1: item.line1,
      city: item.city,
      postcode: item.postcode,
      countyState: item.city === "London" ? "Greater London" : "",
    }));
    goNext("documents");
  };

  useEffect(() => {
    if (step !== "processing" || processingDone) return;

    const timer = setTimeout(async () => {
      setSaving(true);
      try {
        await saveAccountSetup(draft);
        clearCachedCarrierProfile();
        setCachedCarrierDashboard(null);
        setProcessingDone(true);
        setTimeout(async () => {
          await routeAfterAccountSetup();
        }, 1400);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to complete setup.");
        setStep("question-2");
      } finally {
        setSaving(false);
      }
    }, 2200);

    return () => clearTimeout(timer);
  }, [step, processingDone, draft]);

  const canConfirmPhone = draft.phone.replace(/\D/g, "").length >= 10;
  const canContinueDocuments = Boolean(draft.identityDocument);
  const canContinueDocumentUpload = Boolean(draft.identityDocumentLocalUri);
  const canContinueQ1 = draft.accountUses.length > 0;
  const canContinueQ2 = Boolean(draft.annualRevenue);
  const canContinueManual =
    draft.street.trim().length > 1 &&
    draft.houseNumber.trim().length > 0 &&
    draft.city.trim().length > 1 &&
    draft.postcode.trim().length > 3;

  if (step === "requirements") {
    return (
      <SetupShell
        showBack={false}
        footer={
          <View style={styles.requirementsFooter}>
            <View style={styles.footerDivider} />
            <SetupPrimaryButton label="I've got what I need" onPress={() => goNext("phone")} />
            <Pressable style={({ pressed }) => [styles.moreLinkWrap, pressed && styles.pressed]}>
              <Text style={styles.moreLink}>More about Alpha Freight</Text>
            </Pressable>
          </View>
        }
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.requirementsScroll}>
          <Text style={styles.requirementsTitle}>Open your account easily</Text>
          <Text style={styles.requirementsLead}>
            Make sure you've got what you need with you before you start:
          </Text>

          <RequirementRow icon={REQUIREMENTS_ID_ICON} title="A valid form of ID">
            <Text style={styles.requirementBody}>
              We accept{" "}
              <Text style={styles.requirementHighlight}>
                full UK driving licence, passport or residence permit card
              </Text>
              . You'll need to present your original documents.
            </Text>
            <Text style={styles.requirementNote}>
              Non-British citizens may need to provide a valid right to reside document.
            </Text>
            <Pressable style={({ pressed }) => [styles.requirementLinkRow, pressed && styles.pressed]}>
              <Text style={styles.requirementLink}>View right to reside documents</Text>
              <Ionicons name="chevron-forward" size={12} color={colors.ink} />
            </Pressable>
          </RequirementRow>

          <RequirementRow icon={REQUIREMENTS_HOME_ICON} title="You're a UK resident aged 18+" />
        </ScrollView>
      </SetupShell>
    );
  }

  if (step === "phone") {
    return (
      <SetupShell onBack={goBack} footer={<SetupPrimaryButton label="Confirm number" onPress={() => goNext("account-type")} disabled={!canConfirmPhone} />}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={24}>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.phoneScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.heroTitle}>Your mobile number</Text>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Country/region code</Text>
              <View style={styles.codeField}>
                <UkFlag size={20} />
                <Text style={styles.codeValue}>{draft.countryCode}</Text>
                <Ionicons name="chevron-down" size={18} color={colors.muted} />
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Mobile number</Text>
              <TextInput
                value={draft.phone}
                onChangeText={(value) => setDraft((prev) => ({ ...prev, phone: value }))}
                placeholder="7XXX XXX XXX"
                placeholderTextColor={colors.mutedLight}
                keyboardType="phone-pad"
                style={styles.textField}
                autoFocus
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SetupShell>
    );
  }

  if (step === "account-type") {
    const canContinueAccountType = draft.accountType === "company" || draft.accountType === "individual";

    return (
      <SetupShell
        stepKey="account-type"
        onBack={goBack}
        footer={
          <SetupPrimaryButton
            label="Continue"
            onPress={() => setStep("address-intro")}
            disabled={!canContinueAccountType}
          />
        }
      >
        <SetupStepHeader
          title="Choose your account type"
          subtitle="Select how you'll operate on Alpha Freight."
        />

        <View style={styles.typeList}>
          <AccountTypeCard
            label="Business"
            sub="Company, fleet operator or haulage business"
            icon="business-outline"
            selected={draft.accountType === "company"}
            onPress={() => setDraft((prev) => ({ ...prev, accountType: "company" }))}
          />
          <AccountTypeCard
            label="Personal"
            sub="Owner-driver or sole trader"
            icon="person-outline"
            selected={draft.accountType === "individual"}
            onPress={() => setDraft((prev) => ({ ...prev, accountType: "individual" }))}
          />
        </View>
      </SetupShell>
    );
  }

  if (step === "address-intro") {
    return (
      <SetupShell
        stepKey="address-intro"
        onBack={goBack}
        footer={<SetupPrimaryButton label="Add your address" onPress={() => goNext("address-search")} />}
      >
        <View style={styles.illustrationWrap}>
          <View style={styles.doorIllustration}>
            <Ionicons name="home" size={48} color={colors.brand} />
          </View>
        </View>
        <SetupStepHeader title={addressTitle} subtitle="We will need you to verify this address shortly." />
      </SetupShell>
    );
  }

  if (step === "address-search") {
    return (
      <SetupShell stepKey="address-search" onBack={goBack}>
        <SetupStepHeader title="Find your address" subtitle="Search by postcode or city." />

        <View style={styles.searchHeader}>
          <View style={styles.searchField}>
            <Ionicons name="search-outline" size={16} color={colors.muted} />
            <TextInput
              value={addressQuery}
              onChangeText={setAddressQuery}
              placeholder="Search postcode or city"
              placeholderTextColor={colors.mutedLight}
              style={styles.searchInput}
              autoFocus
            />
            {addressQuery ? (
              <Pressable onPress={() => setAddressQuery("")} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={colors.mutedLight} />
              </Pressable>
            ) : null}
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listScroll}>
          {addressSuggestions.map((item) => (
            <Pressable
              key={item.postcode}
              style={({ pressed }) => [styles.addressResult, pressed && styles.pressedLight]}
              onPress={() => selectAddress(item)}
            >
              <Ionicons name="location-outline" size={18} color={colors.ink} />
              <View style={styles.addressResultCopy}>
                <Text style={styles.addressResultTitle}>{item.postcode}</Text>
                <Text style={styles.addressResultSub}>{item.city}, UK</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.mutedLight} />
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.footerInline}>
          <SetupOutlineButton label="Add your address manually" onPress={() => goNext("address-manual")} />
        </View>
      </SetupShell>
    );
  }

  if (step === "address-manual") {
    return (
      <SetupShell
        stepKey="address-manual"
        onBack={goBack}
        footer={
          <SetupPrimaryButton
            label="Continue"
            onPress={() => goNext("documents")}
            disabled={!canContinueManual}
          />
        }
      >
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listScroll}>
            <SetupStepHeader title="Your address" />

            <SetupStaticField label="Country/region">
              <View style={styles.countryRow}>
                <UkFlag size={18} />
                <Text style={styles.countryText}>United Kingdom</Text>
              </View>
            </SetupStaticField>

            <SetupFormField
              label="Street"
              value={draft.street}
              onChangeText={(value) => setDraft((prev) => ({ ...prev, street: value }))}
              autoCapitalize="words"
            />
            <SetupFormField
              label="House or building number"
              value={draft.houseNumber}
              onChangeText={(value) => setDraft((prev) => ({ ...prev, houseNumber: value }))}
            />
            <SetupFormField
              label="Apartment number"
              optional
              value={draft.addressLine2}
              onChangeText={(value) => setDraft((prev) => ({ ...prev, addressLine2: value }))}
            />
            <SetupFormField
              label="City"
              value={draft.city}
              onChangeText={(value) => setDraft((prev) => ({ ...prev, city: value }))}
              autoCapitalize="words"
            />
            <SetupFormField
              label="Postal code"
              value={draft.postcode}
              onChangeText={(value) => setDraft((prev) => ({ ...prev, postcode: value }))}
              autoCapitalize="characters"
            />
            <SetupFormField
              label="County or State"
              optional
              value={draft.countyState}
              onChangeText={(value) => setDraft((prev) => ({ ...prev, countyState: value }))}
              autoCapitalize="words"
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SetupShell>
    );
  }

  if (step === "documents") {
    return (
      <SetupShell
        stepKey="documents"
        onBack={goBack}
        footer={
          <SetupPrimaryButton
            label="Get started"
            onPress={() => goNext("document-upload")}
            disabled={!canContinueDocuments}
          />
        }
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listScroll}>
          <SetupStepHeader
            title="Get your documents ready"
            subtitle="Choose your place of issue and prepare your documents."
          />

          <SetupStaticField label="Place of issue">
            <View style={styles.countryRow}>
              <UkFlag size={18} />
              <Text style={styles.countryText}>United Kingdom</Text>
            </View>
          </SetupStaticField>

          <Text style={styles.sectionHeading}>Your proof of identity</Text>
          <Text style={styles.sectionSub}>
            Based on your place of issue please choose one of the following documents.
          </Text>

          {IDENTITY_DOCUMENTS.map((doc) => (
            <Pressable
              key={doc.id}
              style={({ pressed }) => [styles.docRow, pressed && styles.pressedLight]}
              onPress={() =>
                setDraft((prev) => {
                  const changing = prev.identityDocument !== doc.id;
                  return {
                    ...prev,
                    identityDocument: doc.id as IdentityDocument,
                    identityDocumentLocalUri: changing ? null : prev.identityDocumentLocalUri,
                    identityDocumentUrl: changing ? null : prev.identityDocumentUrl,
                    identityDocumentFileName: changing ? null : prev.identityDocumentFileName,
                  };
                })
              }
            >
              <View style={styles.docIcon}>
                <Ionicons name={doc.icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.ink} />
              </View>
              <Text style={styles.docLabel}>{doc.label}</Text>
              <View style={[styles.radio, draft.identityDocument === doc.id && styles.radioSelected]}>
                {draft.identityDocument === doc.id ? <View style={styles.radioDot} /> : null}
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </SetupShell>
    );
  }

  if (step === "document-upload") {
    return (
      <SetupShell
        stepKey="document-upload"
        onBack={goBack}
        footer={
          <SetupPrimaryButton
            label="Continue"
            onPress={() => void handleDocumentUploadContinue()}
            disabled={!canContinueDocumentUpload}
            loading={uploadingDocument}
          />
        }
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listScroll}>
          <SetupStepHeader
            title="Upload your document"
            subtitle={`Please upload a clear photo of your ${selectedDocumentLabel}.`}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            style={({ pressed }) => [
              styles.uploadDropzone,
              draft.identityDocumentLocalUri && styles.uploadDropzoneFilled,
              pressed && styles.pressedLight,
            ]}
            onPress={() => void pickIdentityDocument(false)}
          >
            {draft.identityDocumentLocalUri ? (
              <Image source={{ uri: draft.identityDocumentLocalUri }} style={styles.uploadPreview} resizeMode="cover" />
            ) : (
              <View style={styles.uploadEmpty}>
                <View style={styles.uploadIconWrap}>
                  <Ionicons name="cloud-upload-outline" size={24} color={colors.ink} />
                </View>
                <Text style={styles.uploadEmptyTitle}>Tap to upload</Text>
                <Text style={styles.uploadEmptySub}>JPG or PNG · max 10MB</Text>
              </View>
            )}
          </Pressable>

          {draft.identityDocumentFileName ? (
            <Text style={styles.uploadFileName}>{draft.identityDocumentFileName}</Text>
          ) : null}

          <View style={styles.uploadActions}>
            <Pressable
              style={({ pressed }) => [styles.uploadActionBtn, pressed && styles.pressedLight]}
              onPress={() => void pickIdentityDocument(true)}
            >
              <Ionicons name="camera-outline" size={16} color={colors.ink} />
              <Text style={styles.uploadActionText}>Take photo</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.uploadActionBtn, pressed && styles.pressedLight]}
              onPress={() => void pickIdentityDocument(false)}
            >
              <Ionicons name="images-outline" size={16} color={colors.ink} />
              <Text style={styles.uploadActionText}>Choose from gallery</Text>
            </Pressable>
          </View>

          <Text style={styles.uploadHint}>
            Make sure all corners are visible and text is easy to read.
          </Text>
        </ScrollView>
      </SetupShell>
    );
  }

  if (step === "question-1") {
    return (
      <SetupShell
        stepKey="question-1"
        onBack={goBack}
        progress={questionProgress}
        footer={
          <SetupPrimaryButton label="Next" onPress={() => goNext("question-2")} disabled={!canContinueQ1} />
        }
      >
        <SetupStepHeader title="What will your account be used for?" subtitle="You may choose more than one." />

        <View style={styles.selectList}>
          {ACCOUNT_USE_OPTIONS.map((option) => {
            const selected = draft.accountUses.includes(option);
            return (
              <SelectRow
                key={option}
                label={option}
                selected={selected}
                multi
                onPress={() =>
                  setDraft((prev) => ({
                    ...prev,
                    accountUses: selected
                      ? prev.accountUses.filter((item) => item !== option)
                      : [...prev.accountUses, option],
                  }))
                }
              />
            );
          })}
        </View>
      </SetupShell>
    );
  }

  if (step === "question-2") {
    return (
      <SetupShell
        stepKey="question-2"
        onBack={goBack}
        progress={questionProgress}
        footer={
          <SetupPrimaryButton
            label="Submit for review"
            onPress={() => goNext("processing")}
            disabled={!canContinueQ2}
          />
        }
      >
        <SetupStepHeader
          title="What's your estimated annual freight revenue?"
          subtitle="This helps us tailor your carrier experience."
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.selectList}>
          {ANNUAL_REVENUE_OPTIONS.map((option) => (
            <SelectRow
              key={option}
              label={option}
              selected={draft.annualRevenue === option}
              onPress={() => setDraft((prev) => ({ ...prev, annualRevenue: option }))}
            />
          ))}
        </View>
      </SetupShell>
    );
  }

  return (
    <SetupShell showBack={false}>
      <View style={styles.processingWrap}>
        <View style={styles.processingContent}>
          <View style={styles.processingIcon}>
            {saving ? (
              <ActivityIndicator size="large" color={colors.ink} />
            ) : (
              <Ionicons name="shield-checkmark" size={56} color={colors.brand} />
            )}
          </View>
          <Text style={styles.heroTitle}>Processing…</Text>
          <Text style={styles.heroSubCenter}>
            This can take a while, feel free to close the app and check later.
          </Text>
        </View>
        <Text style={styles.processingFooter}>We'll notify you when ready</Text>
      </View>
    </SetupShell>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  requirementsScroll: {
    paddingBottom: spacing.md,
    paddingTop: spacing.lg,
  },
  requirementsTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.9,
    lineHeight: 34,
    marginBottom: 8,
  },
  requirementsLead: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: colors.muted,
    marginBottom: 28,
  },
  requirementBlock: {
    marginBottom: 28,
  },
  requirementHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  requirementIconSlot: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  requirementIcon: {
    width: 44,
    height: 44,
  },
  requirementDetails: {
    marginTop: 10,
    paddingLeft: 56,
    gap: 6,
  },
  requirementTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.35,
    lineHeight: 20,
  },
  requirementBody: {
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: "500",
    color: colors.muted,
  },
  requirementHighlight: {
    color: "#6B5CE7",
    fontWeight: "600",
  },
  requirementNote: {
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "500",
    color: colors.mutedLight,
    marginTop: 2,
  },
  requirementLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  requirementLink: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.2,
  },
  requirementsFooter: {
    gap: 12,
    paddingTop: 4,
  },
  footerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginBottom: 4,
  },
  moreLinkWrap: {
    alignItems: "center",
    paddingVertical: 2,
  },
  moreLink: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.muted,
  },
  listScroll: {
    paddingBottom: spacing.lg,
  },
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  countryText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
  },
  pressedLight: {
    opacity: 0.92,
  },
  uploadDropzone: {
    minHeight: 190,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    backgroundColor: colors.canvas,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  uploadDropzoneFilled: {
    borderStyle: "solid",
    backgroundColor: colors.white,
  },
  uploadEmpty: {
    alignItems: "center",
    gap: 8,
    paddingHorizontal: spacing.lg,
  },
  uploadIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brandSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  uploadEmptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
  },
  uploadEmptySub: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.mutedLight,
  },
  uploadPreview: {
    width: "100%",
    height: 190,
  },
  uploadFileName: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.muted,
    textAlign: "center",
  },
  uploadActions: {
    flexDirection: "row",
    gap: 10,
  },
  uploadActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  uploadActionText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.ink,
  },
  uploadHint: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "500",
    color: colors.mutedLight,
    textAlign: "center",
    paddingHorizontal: spacing.md,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.6,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  heroSub: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.muted,
    marginBottom: spacing.lg,
  },
  heroSubCenter: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.muted,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
  fieldBlock: {
    gap: 8,
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
  },
  codeField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 56,
    backgroundColor: colors.white,
  },
  codeValue: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: colors.ink,
  },
  textField: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 56,
    fontSize: 16,
    fontWeight: "600",
    color: colors.ink,
    backgroundColor: colors.white,
  },
  typeList: {
    gap: 10,
  },
  typeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: colors.white,
  },
  typeCardSelected: {
    borderColor: colors.ink,
    backgroundColor: colors.canvas,
  },
  typeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.inputFill,
    alignItems: "center",
    justifyContent: "center",
  },
  typeIconWrapSelected: {
    backgroundColor: colors.brandSoft,
  },
  typeCopy: {
    flex: 1,
    gap: 2,
  },
  typeLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.2,
  },
  typeSub: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.muted,
    fontWeight: "500",
  },
  illustrationWrap: {
    alignItems: "center",
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  doorIllustration: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.brandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  searchHeader: {
    marginBottom: 12,
  },
  searchField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    minHeight: 46,
    backgroundColor: colors.white,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: colors.ink,
  },
  addressResult: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  addressResultCopy: {
    flex: 1,
    gap: 1,
  },
  addressResultTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.ink,
  },
  addressResultSub: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "500",
  },
  footerInline: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  issueField: {
    gap: 8,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
    marginTop: 6,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
    fontWeight: "500",
    marginBottom: 8,
  },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  docIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  docLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: colors.ink,
  },
  selectList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  selectRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  selectLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: colors.ink,
    lineHeight: 20,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: colors.ink,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.ink,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  processingWrap: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: "space-between",
    paddingBottom: spacing.lg,
  },
  processingContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  processingIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.brandSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  processingFooter: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.ink,
    textAlign: "center",
    paddingTop: spacing.md,
  },
  phoneScrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.lg,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  pressed: {
    opacity: 0.86,
  },
});
