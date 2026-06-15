import { apiClient } from "./client";
import type { PlaceOfSupplyOption } from "../gstFinance";

export interface GstTreatmentOption {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  showGstin: boolean;
  showPlaceOfSupply: boolean;
  showTaxPreference: boolean;
  showPan: boolean;
}

export interface PaymentTermOption {
  id: string;
  name: string;
  shortName: string;
  days: number;
  description?: string | null;
}

export interface ClientFormOptions {
  gstTreatments: GstTreatmentOption[];
  placeOfSupply: PlaceOfSupplyOption[];
  paymentTerms: PaymentTermOption[];
}

export async function getClientFormOptions(): Promise<ClientFormOptions> {
  const { data } = await apiClient.get<ClientFormOptions>("/clients/form-options");
  const normalizeTreatment = (t: GstTreatmentOption): GstTreatmentOption => ({
    ...t,
    showGstin: t.showGstin ?? true,
    showPlaceOfSupply: t.showPlaceOfSupply ?? true,
    showTaxPreference: t.showTaxPreference ?? true,
    showPan: t.showPan ?? true,
  });
  return {
    gstTreatments: (data.gstTreatments ?? []).map(normalizeTreatment),
    placeOfSupply: data.placeOfSupply ?? [],
    paymentTerms: data.paymentTerms ?? [],
  };
}
