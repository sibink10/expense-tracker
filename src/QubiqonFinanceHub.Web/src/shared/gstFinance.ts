export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export interface PlaceOfSupplyOption {
  code: string;
  name: string;
  countryCode: string;
  countryName: string;
  isUnionTerritory: boolean;
}

export function applyPlaceOfSupplyFromTaxId(
  gstinOrUin: string,
  placeOptions: PlaceOfSupplyOption[]
): string | null {
  const code = gstinOrUin.trim().slice(0, 2);
  if (!/^\d{2}$/.test(code)) return null;
  return placeOptions.some((p) => p.code === code) ? code : null;
}
