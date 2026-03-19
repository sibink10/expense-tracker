/**
 * Static list of countries with their primary currency.
 * Used for country dropdowns and auto-selecting currency when country changes.
 */
export interface CountryItem {
  name: string;
  currency: string;
}

export const COUNTRIES: CountryItem[] = [
  { name: "Afghanistan", currency: "AFN" },
  { name: "Albania", currency: "ALL" },
  { name: "Algeria", currency: "DZD" },
  { name: "Argentina", currency: "ARS" },
  { name: "Australia", currency: "AUD" },
  { name: "Austria", currency: "EUR" },
  { name: "Bahrain", currency: "BHD" },
  { name: "Bangladesh", currency: "BDT" },
  { name: "Belgium", currency: "EUR" },
  { name: "Brazil", currency: "BRL" },
  { name: "Bulgaria", currency: "BGN" },
  { name: "Canada", currency: "CAD" },
  { name: "Chile", currency: "CLP" },
  { name: "China", currency: "CNY" },
  { name: "Colombia", currency: "COP" },
  { name: "Croatia", currency: "EUR" },
  { name: "Cyprus", currency: "EUR" },
  { name: "Czech Republic", currency: "CZK" },
  { name: "Denmark", currency: "DKK" },
  { name: "Egypt", currency: "EGP" },
  { name: "Estonia", currency: "EUR" },
  { name: "Finland", currency: "EUR" },
  { name: "France", currency: "EUR" },
  { name: "Germany", currency: "EUR" },
  { name: "Greece", currency: "EUR" },
  { name: "Hong Kong", currency: "HKD" },
  { name: "Hungary", currency: "HUF" },
  { name: "Iceland", currency: "ISK" },
  { name: "India", currency: "INR" },
  { name: "Indonesia", currency: "IDR" },
  { name: "Iran", currency: "IRR" },
  { name: "Iraq", currency: "IQD" },
  { name: "Ireland", currency: "EUR" },
  { name: "Israel", currency: "ILS" },
  { name: "Italy", currency: "EUR" },
  { name: "Japan", currency: "JPY" },
  { name: "Jordan", currency: "JOD" },
  { name: "Kenya", currency: "KES" },
  { name: "South Korea", currency: "KRW" },
  { name: "Kuwait", currency: "KWD" },
  { name: "Latvia", currency: "EUR" },
  { name: "Lebanon", currency: "LBP" },
  { name: "Lithuania", currency: "EUR" },
  { name: "Luxembourg", currency: "EUR" },
  { name: "Malaysia", currency: "MYR" },
  { name: "Malta", currency: "EUR" },
  { name: "Mexico", currency: "MXN" },
  { name: "Morocco", currency: "MAD" },
  { name: "Netherlands", currency: "EUR" },
  { name: "New Zealand", currency: "NZD" },
  { name: "Nigeria", currency: "NGN" },
  { name: "Norway", currency: "NOK" },
  { name: "Oman", currency: "OMR" },
  { name: "Pakistan", currency: "PKR" },
  { name: "Philippines", currency: "PHP" },
  { name: "Poland", currency: "PLN" },
  { name: "Portugal", currency: "EUR" },
  { name: "Qatar", currency: "QAR" },
  { name: "Romania", currency: "RON" },
  { name: "Russia", currency: "RUB" },
  { name: "Saudi Arabia", currency: "SAR" },
  { name: "Singapore", currency: "SGD" },
  { name: "Slovakia", currency: "EUR" },
  { name: "Slovenia", currency: "EUR" },
  { name: "South Africa", currency: "ZAR" },
  { name: "Spain", currency: "EUR" },
  { name: "Sri Lanka", currency: "LKR" },
  { name: "Sweden", currency: "SEK" },
  { name: "Switzerland", currency: "CHF" },
  { name: "Taiwan", currency: "TWD" },
  { name: "Thailand", currency: "THB" },
  { name: "Turkey", currency: "TRY" },
  { name: "Ukraine", currency: "UAH" },
  { name: "United Arab Emirates", currency: "AED" },
  { name: "United Kingdom", currency: "GBP" },
  { name: "United States", currency: "USD" },
  { name: "Vietnam", currency: "VND" },
];

/** Dropdown options for country select: { value: countryName, label: countryName } */
export const COUNTRY_OPTS = COUNTRIES.map((c) => ({ v: c.name, l: c.name }));

/** Legacy country code to name mapping for backward compatibility */
const COUNTRY_CODE_TO_NAME: Record<string, string> = {
  IN: "India",
  US: "United States",
  GB: "United Kingdom",
  AE: "United Arab Emirates",
  AU: "Australia",
  CA: "Canada",
  SG: "Singapore",
  MY: "Malaysia",
  DE: "Germany",
  FR: "France",
  NL: "Netherlands",
  ES: "Spain",
  IT: "Italy",
  CH: "Switzerland",
  IE: "Ireland",
  JP: "Japan",
  KR: "South Korea",
  CN: "China",
  HK: "Hong Kong",
  NZ: "New Zealand",
  SA: "Saudi Arabia",
  QA: "Qatar",
  BE: "Belgium",
  SE: "Sweden",
  NO: "Norway",
  DK: "Denmark",
  FI: "Finland",
  PL: "Poland",
  AT: "Austria",
  PT: "Portugal",
  BR: "Brazil",
  ZA: "South Africa",
  IL: "Israel",
  PH: "Philippines",
  TH: "Thailand",
  VN: "Vietnam",
  ID: "Indonesia",
  PK: "Pakistan",
  BD: "Bangladesh",
  LK: "Sri Lanka",
  EG: "Egypt",
  KE: "Kenya",
  NG: "Nigeria",
  MX: "Mexico",
  AR: "Argentina",
  CL: "Chile",
  CO: "Colombia",
  TR: "Turkey",
  RU: "Russia",
  UA: "Ukraine",
};

/** Normalize country value (handles legacy codes). Returns country name. */
export function normalizeCountry(value: string | undefined): string {
  if (!value?.trim()) return "";
  const v = value.trim();
  return COUNTRY_CODE_TO_NAME[v] ?? v;
}

/** Get currency code for a country name. Returns "INR" if not found. */
export function getCurrencyByCountry(countryName: string): string {
  if (!countryName?.trim()) return "INR";
  const found = COUNTRIES.find(
    (c) => c.name.toLowerCase() === countryName.trim().toLowerCase()
  );
  return found?.currency ?? "INR";
}

/** Unique currencies from all countries, plus common extras. For currency dropdown. */
const CURRENCY_SET = new Set([
  ...COUNTRIES.map((c) => c.currency),
  "INR",
  "USD",
  "EUR",
  "GBP",
  "AED",
  "SGD",
  "CAD",
  "AUD",
  "JPY",
  "CHF",
]);

/** Dropdown options for currency select, sorted with common ones first */
export const CURRENCY_OPTS = [
  { v: "INR", l: "INR" },
  { v: "USD", l: "USD" },
  { v: "EUR", l: "EUR" },
  { v: "GBP", l: "GBP" },
  { v: "AED", l: "AED" },
  { v: "SGD", l: "SGD" },
  { v: "CAD", l: "CAD" },
  { v: "AUD", l: "AUD" },
  { v: "JPY", l: "JPY" },
  { v: "CHF", l: "CHF" },
  ...Array.from(CURRENCY_SET)
    .filter((c) => !["INR", "USD", "EUR", "GBP", "AED", "SGD", "CAD", "AUD", "JPY", "CHF"].includes(c))
    .sort()
    .map((c) => ({ v: c, l: c })),
];
