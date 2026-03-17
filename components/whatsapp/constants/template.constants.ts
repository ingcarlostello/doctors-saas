import enCommon from "@/public/locales/en/common.json";
import esCommon from "@/public/locales/es/common.json";
import ptCommon from "@/public/locales/pt/common.json";
import frCommon from "@/public/locales/fr/common.json";

export const i18nCommon: Record<string, any> = {
  en: enCommon.common,
  es: esCommon.common,
  pt: ptCommon.common,
  fr: frCommon.common,
};

export const categories = [
  { value: "utility", label: "Utilidad (Citas, Recordatorios)" },
  { value: "marketing", label: "Marketing" },
  { value: "authentication", label: "Autenticación" },
];

export const languages = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
  { value: "pt", label: "Português" },
];
