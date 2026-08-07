export const ALPHA_FREIGHT_BANK_DETAILS = {
  bankName: "ClearBank Limited",
  accountName: "ALPHA FREIGHT SOLUTIONS LIMITED",
  accountNumber: "00284512",
  sortCode: "04-19-19",
  iban: "GB68TAPD04191900284512",
} as const;

export type AlphaFreightBankDetailField = {
  label: string;
  value: string;
  copyValue?: string;
};

export function getAlphaFreightBankDetailFields(): AlphaFreightBankDetailField[] {
  const { bankName, accountName, accountNumber, sortCode, iban } = ALPHA_FREIGHT_BANK_DETAILS;
  return [
    { label: "Bank name", value: bankName },
    { label: "Account name", value: accountName },
    { label: "Bank account number", value: accountNumber },
    { label: "Sort code", value: sortCode },
    { label: "IBAN (for international transfers)", value: iban },
  ];
}
