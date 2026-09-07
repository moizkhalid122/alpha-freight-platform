export type UiLanguage =
  | "en"
  | "es"
  | "pt"
  | "de"
  | "fr"
  | "it"
  | "nl"
  | "pl"
  | "tr"
  | "ar"
  | "hi"
  | "zh"
  | "ja"
  | "ko"
  | "sv"
  | "no"
  | "da"
  | "ro"
  | "uk"
  | "ru"
  | "ur"
  | "ur_roman"
  | "fi";

export type MessageTree = {
  [key: string]: string | MessageTree;
};
