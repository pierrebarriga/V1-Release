import { supabase } from "./SupabaseClient";
import type { Bill } from "../types/bill";

export async function searchBills(query: string): Promise<Bill[]> {
  const { data, error } = await supabase
    .from("L2_senate_bills")
    .select("*")
    .ilike("title", `%${query}%`)
    .limit(25);

  if (error) {
    throw error;
  }

  return data ?? [];
}