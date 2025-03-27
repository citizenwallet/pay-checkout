import { SupabaseClient } from "@supabase/supabase-js";
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
) => {
  return client
    .from("order_processor_tx")
    .insert({
      type,
      processor_tx_id,
    })
    .select()
    .maybeSingle();
};
