import { supabase } from "@/integrations/supabase/client";

export interface PIXConfig {
  id: string;
  session_id: string | null;
  pix_key: string;
  recipient_name: string;
  recipient_city: string;
}

export interface AdsConfig {
  id: string;
  session_id: string | null;
  ads: string[];
}

export async function getPixConfig(sessionId: string): Promise<PIXConfig | null> {
  try {
    // Primeiro tenta buscar configuração da sessão
    const { data: sessionConfig } = await supabase
      .from("pix_config")
      .select("*")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (sessionConfig) {
      return sessionConfig as PIXConfig;
    }

    // Se não encontrar, busca configuração global
    const { data: globalConfig } = await supabase
      .from("pix_config")
      .select("*")
      .is("session_id", null)
      .maybeSingle();

    return globalConfig as PIXConfig | null;
  } catch (error) {
    console.error("Error loading PIX config:", error);
    return null;
  }
}

export async function getAdsConfig(sessionId: string): Promise<string[]> {
  try {
    // Primeiro tenta buscar configuração da sessão
    const { data: sessionConfig } = await supabase
      .from("ads_config")
      .select("ads")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (sessionConfig && sessionConfig.ads) {
      return sessionConfig.ads as string[];
    }

    // Se não encontrar, busca configuração global
    const { data: globalConfig } = await supabase
      .from("ads_config")
      .select("ads")
      .is("session_id", null)
      .maybeSingle();

    return (globalConfig?.ads as string[]) || [];
  } catch (error) {
    console.error("Error loading ads config:", error);
    return [];
  }
}

export async function getGlobalPixConfig(): Promise<PIXConfig | null> {
  try {
    const { data } = await supabase
      .from("pix_config")
      .select("*")
      .is("session_id", null)
      .maybeSingle();

    return data as PIXConfig | null;
  } catch (error) {
    console.error("Error loading global PIX config:", error);
    return null;
  }
}

export async function getGlobalAdsConfig(): Promise<string[]> {
  try {
    const { data } = await supabase
      .from("ads_config")
      .select("ads")
      .is("session_id", null)
      .maybeSingle();

    return (data?.ads as string[]) || [];
  } catch (error) {
    console.error("Error loading global ads config:", error);
    return [];
  }
}
