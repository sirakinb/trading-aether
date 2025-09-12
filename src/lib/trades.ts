import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Trade = Tables<"trades">;
export type TradeInsert = TablesInsert<"trades">;
export type TradeUpdate = TablesUpdate<"trades">;

export class TradesAPI {
  // Get all trades for the current user
  static async getAll() {
    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data;
  }

  // Get a single trade by ID
  static async getById(id: string) {
    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  // Create a new trade
  static async create(trade: Omit<TradeInsert, "user_id">) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("trades")
      .insert({
        ...trade,
        user_id: user.id,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Update an existing trade
  static async update(id: string, updates: TradeUpdate) {
    const { data, error } = await supabase
      .from("trades")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Delete a trade
  static async delete(id: string) {
    const { error } = await supabase
      .from("trades")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
  }

  // Get trades by conversation
  static async getByConversation(conversationId: string) {
    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data;
  }

  // Get trades by outcome
  static async getByOutcome(outcome: "unknown" | "win" | "loss") {
    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .eq("outcome", outcome)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return data;
  }

  // Get trade statistics
  static async getStats() {
    const { data: trades, error } = await supabase
      .from("trades")
      .select("outcome, rr_numeric");
    
    if (error) throw error;

    const stats = {
      total: trades.length,
      wins: trades.filter(t => t.outcome === "win").length,
      losses: trades.filter(t => t.outcome === "loss").length,
      unknown: trades.filter(t => t.outcome === "unknown").length,
      winRate: 0,
      avgRR: 0,
    };

    const completed = stats.wins + stats.losses;
    if (completed > 0) {
      stats.winRate = (stats.wins / completed) * 100;
    }

    const tradesWithRR = trades.filter(t => t.rr_numeric !== null);
    if (tradesWithRR.length > 0) {
      stats.avgRR = tradesWithRR.reduce((sum, t) => sum + (t.rr_numeric || 0), 0) / tradesWithRR.length;
    }

    return stats;
  }
}