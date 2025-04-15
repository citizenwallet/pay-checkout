import { PostgrestSingleResponse, SupabaseClient } from "@supabase/supabase-js";
import "server-only";

export type ProcessorTxType = "viva" | "stripe";

export interface OrderProcessorTx {
  id: number;
  created_at: string;
  type: ProcessorTxType;
  processor_tx_id: string;
}

export const createOrderProcessorTx = async (
  client: SupabaseClient,
  type: ProcessorTxType,
  processor_tx_id: string
): Promise<PostgrestSingleResponse<OrderProcessorTx | null>> => {
  return client
    .from("orders_processor_tx")
    .insert({
      type,
      processor_tx_id,
    })
    .select()
    .maybeSingle();
};

export const getOrderProcessorTx = async (
  client: SupabaseClient,
  type: ProcessorTxType,
  processor_tx_id: string
): Promise<PostgrestSingleResponse<OrderProcessorTx | null>> => {
  return client
    .from("orders_processor_tx")
    .select()
    .eq("type", type)
    .eq("processor_tx_id", processor_tx_id)
    .maybeSingle();
};
