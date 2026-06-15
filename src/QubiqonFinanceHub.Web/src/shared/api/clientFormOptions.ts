import { apiClient } from "./client";
import type { PlaceOfSupplyOption } from "../gstFinance";

export interface GstTreatmentOption {
  id: string;
  code: string;
  name: string;
  description?: string | null;
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
  return {
    gstTreatments: data.gstTreatments ?? [],
    placeOfSupply: data.placeOfSupply ?? [],
    paymentTerms: data.paymentTerms ?? [],
  };
}
