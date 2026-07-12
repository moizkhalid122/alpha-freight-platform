export const ALPHA_FREIGHT_BANK_DETAILS = {
  walletLabel: "GBP wallet",
  bankName: "Clearbank Limited",
  accountName: "ALPHA FREIGHT SOLUTIONS LIMITED",
  accountNumber: "00284512",
  sortCode: "04-19-19",
  sortCodeDigits: "041919",
  iban: "GB68TAPD04191900284512",
  currency: "GBP",
} as const;

export function formatBankReference(loadId: string) {
  return loadId.trim();
}
