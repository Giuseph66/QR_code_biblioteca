import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Save, Globe, Palette } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getPixConfig, getGlobalPixConfig, getAdsConfig, getGlobalAdsConfig } from "@/utils/configHelper";
import { hslToHex, hexToHsl } from "@/utils/colorConverter";
import { formatPixKey, validatePixKey, getPixKeyType, isAmbiguousCpfOrPhone, formatAsPhone, formatAsCpf } from "@/utils/pixKeyValidator";
import type { ThemeColors } from "@/hooks/useThemeConfig";
import { AdItemEditor } from "@/components/AdItemEditor";
import { AdItem, detectAdType } from "@/types/ads";

export default function Config() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session");
  const navigate = useNavigate();

  const [pixKey, setPixKey] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientCity, setRecipientCity] = useState("");
  const [adItems, setAdItems] = useState<AdItem[]>([]);
  const [newAdUrl, setNewAdUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [isGlobal, setIsGlobal] = useState(searchParams.get("global") === "true");
  const [hasSessionConfig, setHasSessionConfig] = useState(false);
  const [hasSessionAdsConfig, setHasSessionAdsConfig] = useState(false);
  const [pixKeyError, setPixKeyError] = useState<string | null>(null);
  const [showPixKeyTypeChoice, setShowPixKeyTypeChoice] = useState(false);
  
  // Theme colors state
  const [themeColors, setThemeColors] = useState<Partial<ThemeColors>>({
    light_primary: '240 5.9% 10%',
    light_background: '0 0% 100%',
    light_foreground: '240 10% 3.9%',
    light_button_primary: '195 85% 45%',
    light_button_primary_foreground: '0 0% 100%',
    light_button_secondary: '145 70% 48%',
    light_button_secondary_foreground: '0 0% 100%',
    dark_primary: '0 0% 98%',
    dark_background: '240 10% 3.9%',
    dark_foreground: '0 0% 98%',
    dark_button_primary: '195 85% 55%',
    dark_button_primary_foreground: '220 20% 8%',
    dark_button_secondary: '145 70% 55%',
    dark_button_secondary_foreground: '220 20% 8%',
  });

  useEffect(() => {
    const globalParam = searchParams.get("global") === "true";
    if (globalParam && !isGlobal) {
      setIsGlobal(true);
    }
    
    // Verifica usando o valor mais atual (seja do state ou da URL)
    // Isso evita redirecionamento prematuro na primeira renderização
    const effectiveIsGlobal = isGlobal || globalParam;

    if (!sessionId && !effectiveIsGlobal) {
      navigate("/");
      return;
    }
    loadConfig();
    loadThemeConfig();
  }, [sessionId, isGlobal, searchParams]);

  const loadConfig = async () => {
    if (!sessionId && !isGlobal) return;

    try {
      if (isGlobal) {
        // Carregar configuração global
        const pixConfig = await getGlobalPixConfig();
        await loadAdItems(null);

        if (pixConfig) {
          setPixKey(pixConfig.pix_key);
          setRecipientName(pixConfig.recipient_name);
          setRecipientCity(pixConfig.recipient_city);
        }
      } else {
        // Carregar configuração da sessão ou global como fallback
        const { data: sessionPixConfig } = await supabase
          .from("pix_config")
          .select("*")
          .eq("session_id", sessionId)
          .maybeSingle();

        setHasSessionConfig(!!sessionPixConfig);

        const pixConfig = await getPixConfig(sessionId!);
        if (pixConfig) {
          setPixKey(pixConfig.pix_key);
          setRecipientName(pixConfig.recipient_name);
          setRecipientCity(pixConfig.recipient_city);
        }

        const { data: sessionAdsConfig } = await supabase
          .from("ads_config")
          .select("*")
          .eq("session_id", sessionId)
          .maybeSingle();

        setHasSessionAdsConfig(!!sessionAdsConfig);

        await loadAdItems(sessionId);
      }
    } catch (error) {
      console.error("Error loading config:", error);
    }
  };

  const loadAdItems = async (targetSessionId: string | null) => {
    try {
      // First, find the ads_config
      let adsConfigQuery = supabase.from("ads_config").select("id, ads");
      
      if (targetSessionId) {
        adsConfigQuery = adsConfigQuery.eq("session_id", targetSessionId);
      } else {
        adsConfigQuery = adsConfigQuery.is("session_id", null);
      }

      const { data: adsConfig } = await adsConfigQuery.maybeSingle();

      if (adsConfig) {
        // Try to load ad_items
        const { data: items } = await supabase
          .from("ad_items")
          .select("*")
          .eq("ads_config_id", adsConfig.id)
          .order("sort_order");

        if (items && items.length > 0) {
          setAdItems(items.map(item => ({
            id: item.id,
            url: item.url,
            ad_type: item.ad_type as 'image' | 'video' | 'youtube',
            duration: item.duration,
            fit_mode: item.fit_mode as 'cover' | 'contain' | 'fill',
            sort_order: item.sort_order,
          })));
          return;
        }

        // Fallback: convert legacy ads array to ad_items
        if (adsConfig.ads && Array.isArray(adsConfig.ads)) {
          const legacyItems: AdItem[] = (adsConfig.ads as string[]).map((url, i) => ({
            url,
            ad_type: detectAdType(url),
            duration: 10,
            fit_mode: 'contain',
            sort_order: i,
          }));
          setAdItems(legacyItems);
          return;
        }
      }

      setAdItems([]);
    } catch (error) {
      console.error("Error loading ad items:", error);
      setAdItems([]);
    }
  };

  const handlePixKeyChange = (value: string) => {
    setPixKey(value);
    setPixKeyError(null);
    setShowPixKeyTypeChoice(false);
  };

  const handlePixKeyBlur = () => {
    if (pixKey.trim()) {
      // Check if it's ambiguous (11 digits could be CPF or phone)
      if (isAmbiguousCpfOrPhone(pixKey)) {
        setShowPixKeyTypeChoice(true);
        return;
      }
      
      const formatted = formatPixKey(pixKey);
      setPixKey(formatted);
      
      const validation = validatePixKey(formatted);
      setPixKeyError(validation.valid ? null : validation.error || null);
    }
  };

  const handlePixKeyTypeChoice = (type: 'phone' | 'cpf') => {
    if (type === 'phone') {
      const formatted = formatAsPhone(pixKey);
      setPixKey(formatted);
      const validation = validatePixKey(formatted);
      setPixKeyError(validation.valid ? null : validation.error || null);
    } else {
      const formatted = formatAsCpf(pixKey);
      setPixKey(formatted);
      const validation = validatePixKey(formatted);
      setPixKeyError(validation.valid ? null : validation.error || null);
    }
    setShowPixKeyTypeChoice(false);
  };

  const savePIXConfig = async () => {
    if (!sessionId && !isGlobal) return;
    
    // Validação dos campos obrigatórios
    if (!pixKey.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "A chave PIX é obrigatória.",
        variant: "destructive",
      });
      return;
    }
    
    // Validação da chave PIX
    const validation = validatePixKey(pixKey);
    if (!validation.valid) {
      setPixKeyError(validation.error || "Chave PIX inválida");
      toast({
        title: "Chave PIX inválida",
        description: validation.error || "Formato de chave PIX inválido.",
        variant: "destructive",
      });
      return;
    }
    
    if (!recipientName.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O nome do recebedor é obrigatório.",
        variant: "destructive",
      });
      return;
    }
    
    if (!recipientCity.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "A cidade é obrigatória.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    try {
      const targetSessionId = isGlobal ? null : sessionId;
      
      let query = supabase
        .from("pix_config")
        .select("id");
      
      if (isGlobal) {
        query = query.is("session_id", null);
      } else {
        query = query.eq("session_id", targetSessionId);
      }
      
      const { data: existing } = await query.maybeSingle();

      if (existing) {
        await supabase
          .from("pix_config")
          .update({
            pix_key: pixKey.trim(),
            recipient_name: recipientName.trim(),
            recipient_city: recipientCity.trim().toUpperCase(),
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("pix_config").insert({
          session_id: targetSessionId,
          pix_key: pixKey.trim(),
          recipient_name: recipientName.trim(),
          recipient_city: recipientCity.trim().toUpperCase(),
        });
      }

      if (!isGlobal) {
        setHasSessionConfig(true);
      }

      toast({
        title: "Configurações salvas",
        description: isGlobal 
          ? "Configurações globais PIX atualizadas com sucesso." 
          : "Configurações PIX da sessão atualizadas com sucesso.",
      });
    } catch (error) {
      console.error("Error saving PIX config:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações PIX.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveAdsConfig = async () => {
    if (!sessionId && !isGlobal) return;
    setLoading(true);

    try {
      const targetSessionId = isGlobal ? null : sessionId;
      
      let query = supabase
        .from("ads_config")
        .select("id");
      
      if (isGlobal) {
        query = query.is("session_id", null);
      } else {
        query = query.eq("session_id", targetSessionId);
      }
      
      const { data: existing } = await query.maybeSingle();
      let adsConfigId: string;

      if (existing) {
        adsConfigId = existing.id;
        // Keep ads array for backwards compatibility
        await supabase
          .from("ads_config")
          .update({ ads: adItems.map(item => item.url) })
          .eq("id", existing.id);
      } else {
        const { data: newConfig, error: insertError } = await supabase
          .from("ads_config")
          .insert({
            session_id: targetSessionId,
            ads: adItems.map(item => item.url),
          })
          .select("id")
          .single();

        if (insertError) throw insertError;
        adsConfigId = newConfig.id;
      }

      // Delete existing ad_items for this config
      await supabase
        .from("ad_items")
        .delete()
        .eq("ads_config_id", adsConfigId);

      // Insert new ad_items
      if (adItems.length > 0) {
        const itemsToInsert = adItems.map((item, index) => ({
          ads_config_id: adsConfigId,
          url: item.url,
          ad_type: item.ad_type,
          duration: item.duration,
          fit_mode: item.fit_mode,
          sort_order: index,
        }));

        await supabase.from("ad_items").insert(itemsToInsert);
      }

      if (!isGlobal) {
        setHasSessionAdsConfig(true);
      }

      toast({
        title: "Anúncios salvos",
        description: isGlobal
          ? "Configurações globais de anúncios atualizadas com sucesso."
          : "Configurações de anúncios da sessão atualizadas com sucesso.",
      });
    } catch (error) {
      console.error("Error saving ads config:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar anúncios.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addAd = () => {
    if (newAdUrl.trim()) {
      const newItem: AdItem = {
        url: newAdUrl.trim(),
        ad_type: detectAdType(newAdUrl.trim()),
        duration: 10,
        fit_mode: 'contain',
        sort_order: adItems.length,
      };
      setAdItems([...adItems, newItem]);
      setNewAdUrl("");
    }
  };

  const updateAdItem = (index: number, item: AdItem) => {
    const newItems = [...adItems];
    newItems[index] = item;
    setAdItems(newItems);
  };

  const removeAdItem = (index: number) => {
    setAdItems(adItems.filter((_, i) => i !== index));
  };

  const loadThemeConfig = async () => {
    if (!isGlobal) return;
    
    try {
      const { data } = await supabase
        .from('theme_config')
        .select('*')
        .is('session_id', null)
        .maybeSingle();

      if (data) {
        setThemeColors(data);
      }
    } catch (error) {
      console.error('Error loading theme config:', error);
    }
  };

  const saveThemeConfig = async () => {
    if (!isGlobal) return;
    setLoading(true);

    try {
      const { data: existing } = await supabase
        .from('theme_config')
        .select('id')
        .is('session_id', null)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('theme_config')
          .update(themeColors)
          .eq('id', existing.id);
      } else {
        await supabase
          .from('theme_config')
          .insert({
            session_id: null,
            ...themeColors,
          });
      }

      // Apply theme immediately by creating/updating style element
      let styleElement = document.getElementById('custom-theme-styles');
      
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'custom-theme-styles';
        document.head.appendChild(styleElement);
      }

      // Build CSS with both light and dark theme rules
      const css = `
        :root {
          --background: ${themeColors.light_background};
          --foreground: ${themeColors.light_foreground};
          --card: ${themeColors.light_card};
          --card-foreground: ${themeColors.light_card_foreground};
          --primary: ${themeColors.light_button_primary || themeColors.light_primary};
          --primary-foreground: ${themeColors.light_button_primary_foreground || themeColors.light_primary_foreground};
          --secondary: ${themeColors.light_button_secondary || themeColors.light_secondary};
          --secondary-foreground: ${themeColors.light_button_secondary_foreground || themeColors.light_secondary_foreground};
          --muted: ${themeColors.light_muted};
          --muted-foreground: ${themeColors.light_muted_foreground};
          --accent: ${themeColors.light_accent};
          --accent-foreground: ${themeColors.light_accent_foreground};
          --border: ${themeColors.light_border};
        }

        .dark {
          --background: ${themeColors.dark_background};
          --foreground: ${themeColors.dark_foreground};
          --card: ${themeColors.dark_card};
          --card-foreground: ${themeColors.dark_card_foreground};
          --primary: ${themeColors.dark_button_primary || themeColors.dark_primary};
          --primary-foreground: ${themeColors.dark_button_primary_foreground || themeColors.dark_primary_foreground};
          --secondary: ${themeColors.dark_button_secondary || themeColors.dark_secondary};
          --secondary-foreground: ${themeColors.dark_button_secondary_foreground || themeColors.dark_secondary_foreground};
          --muted: ${themeColors.dark_muted};
          --muted-foreground: ${themeColors.dark_muted_foreground};
          --accent: ${themeColors.dark_accent};
          --accent-foreground: ${themeColors.dark_accent_foreground};
          --border: ${themeColors.dark_border};
        }
      `;

      styleElement.textContent = css;

      toast({
        title: 'Tema salvo',
        description: 'Configurações de tema atualizadas com sucesso.',
      });
    } catch (error) {
      console.error('Error saving theme config:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar tema.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateThemeColor = (key: keyof ThemeColors, hexColor: string) => {
    const hslValue = hexToHsl(hexColor);
    setThemeColors(prev => ({ ...prev, [key]: hslValue }));
  };

  if (!sessionId && !isGlobal) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold"><span>Configurações</span></h1>
            {isGlobal ? (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <p className="text-muted-foreground"><span>Configuração Global</span></p>
              </div>
            ) : (
              <p className="text-muted-foreground"><span>Sessão: {sessionId}</span></p>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => setIsGlobal(!isGlobal)}
            className="flex items-center gap-2"
          >
            <Globe className="h-4 w-4" />
            <span>{isGlobal ? "Voltar para Sessão" : "Configuração Global"}</span>
          </Button>
        </div>

        <Tabs defaultValue="pix" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pix"><span>Chave PIX</span></TabsTrigger>
            <TabsTrigger value="ads"><span>Anúncios</span></TabsTrigger>
            <TabsTrigger value="theme"><span>Temas</span></TabsTrigger>
          </TabsList>

          <TabsContent value="pix" className="space-y-4">
            <Card className="p-6 space-y-4">
              {!isGlobal && !hasSessionConfig && (
                <Badge variant="secondary" className="w-fit">
                  <Globe className="h-3 w-3 mr-1" />
                  <span>Usando configuração global</span>
                </Badge>
              )}
              <div>
                <Label htmlFor="pixKey">Chave PIX *</Label>
                <Input
                  id="pixKey"
                  value={pixKey}
                  onChange={(e) => handlePixKeyChange(e.target.value)}
                  onBlur={handlePixKeyBlur}
                  placeholder="Telefone, email, CPF, CNPJ ou chave aleatória"
                  required
                  className={pixKeyError ? "border-destructive" : ""}
                />
                {pixKeyError && (
                  <p className="text-xs text-destructive mt-1">{pixKeyError}</p>
                )}
                {showPixKeyTypeChoice && (
                  <div className="flex items-center gap-2 mt-2 p-2 bg-muted rounded-md">
                    <span className="text-sm text-muted-foreground">Este número é:</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handlePixKeyTypeChoice('phone')}
                    >
                      Telefone (+55)
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handlePixKeyTypeChoice('cpf')}
                    >
                      CPF
                    </Button>
                  </div>
                )}
                {pixKey && !pixKeyError && !showPixKeyTypeChoice && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Tipo: {getPixKeyType(pixKey)}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Para telefone, o formato +55 será adicionado automaticamente
                </p>
              </div>

              <div>
                <Label htmlFor="recipientName">Nome do Recebedor *</Label>
                <Input
                  id="recipientName"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="João Silva"
                  required
                />
              </div>

              <div>
                <Label htmlFor="recipientCity">Cidade *</Label>
                <Input
                  id="recipientCity"
                  value={recipientCity}
                  onChange={(e) => setRecipientCity(e.target.value.toUpperCase())}
                  placeholder="SAO PAULO"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  A cidade deve estar em maiúsculo (obrigatório pelo Mercado Pago)
                </p>
              </div>

              <Button onClick={savePIXConfig} disabled={loading} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Salvar Configurações PIX
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="ads" className="space-y-4">
            <Card className="p-6 space-y-4">
              {!isGlobal && !hasSessionAdsConfig && (
                <Badge variant="secondary" className="w-fit">
                  <Globe className="h-3 w-3 mr-1" />
                  Usando configuração global
                </Badge>
              )}
              <div>
                <Label>Adicionar Anúncio</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Adicione URLs de imagens, vídeos locais ou links do YouTube. Configure tempo e ajuste de cada anúncio individualmente.
                </p>
                <div className="flex gap-2">
                  <Input
                    value={newAdUrl}
                    onChange={(e) => setNewAdUrl(e.target.value)}
                    placeholder="https://exemplo.com/imagem.jpg ou link do YouTube"
                    onKeyPress={(e) => e.key === "Enter" && addAd()}
                  />
                  <Button onClick={addAd} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {adItems.length > 0 && (
                <div className="space-y-4">
                  <Label>Anúncios Configurados ({adItems.length})</Label>
                  {adItems.map((item, index) => (
                    <AdItemEditor
                      key={index}
                      item={item}
                      index={index}
                      onChange={updateAdItem}
                      onRemove={removeAdItem}
                    />
                  ))}
                </div>
              )}

              <Button onClick={saveAdsConfig} disabled={loading} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Salvar Anúncios
              </Button>
            </Card>
          </TabsContent>

          {isGlobal && (
            <TabsContent value="theme" className="space-y-4">
              <Card className="p-6 space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Palette className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">Personalizar Cores</h3>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-md font-medium mb-3 flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-background border-2 border-foreground" />
                      Tema Claro
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="light-primary">Cor Primária</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            id="light-primary"
                            type="color"
                            value={hslToHex(themeColors.light_primary || '240 5.9% 10%')}
                            onChange={(e) => updateThemeColor('light_primary', e.target.value)}
                            className="w-16 h-10 cursor-pointer"
                          />
                          <Input
                            value={themeColors.light_primary}
                            onChange={(e) => setThemeColors(prev => ({ ...prev, light_primary: e.target.value }))}
                            placeholder="240 5.9% 10%"
                            className="flex-1 font-mono text-sm"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="light-background">Cor de Fundo</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            id="light-background"
                            type="color"
                            value={hslToHex(themeColors.light_background || '0 0% 100%')}
                            onChange={(e) => updateThemeColor('light_background', e.target.value)}
                            className="w-16 h-10 cursor-pointer"
                          />
                          <Input
                            value={themeColors.light_background}
                            onChange={(e) => setThemeColors(prev => ({ ...prev, light_background: e.target.value }))}
                            placeholder="0 0% 100%"
                            className="flex-1 font-mono text-sm"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="light-foreground">Cor do Texto</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            id="light-foreground"
                            type="color"
                            value={hslToHex(themeColors.light_foreground || '240 10% 3.9%')}
                            onChange={(e) => updateThemeColor('light_foreground', e.target.value)}
                            className="w-16 h-10 cursor-pointer"
                          />
                          <Input
                            value={themeColors.light_foreground}
                            onChange={(e) => setThemeColors(prev => ({ ...prev, light_foreground: e.target.value }))}
                            placeholder="240 10% 3.9%"
                            className="flex-1 font-mono text-sm"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="light-button-primary">Botão Primário</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            id="light-button-primary"
                            type="color"
                            value={hslToHex(themeColors.light_button_primary || '195 85% 45%')}
                            onChange={(e) => updateThemeColor('light_button_primary', e.target.value)}
                            className="w-16 h-10 cursor-pointer"
                          />
                          <Input
                            value={themeColors.light_button_primary}
                            onChange={(e) => setThemeColors(prev => ({ ...prev, light_button_primary: e.target.value }))}
                            placeholder="195 85% 45%"
                            className="flex-1 font-mono text-sm"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="light-button-secondary">Botão Secundário</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            id="light-button-secondary"
                            type="color"
                            value={hslToHex(themeColors.light_button_secondary || '145 70% 48%')}
                            onChange={(e) => updateThemeColor('light_button_secondary', e.target.value)}
                            className="w-16 h-10 cursor-pointer"
                          />
                          <Input
                            value={themeColors.light_button_secondary}
                            onChange={(e) => setThemeColors(prev => ({ ...prev, light_button_secondary: e.target.value }))}
                            placeholder="145 70% 48%"
                            className="flex-1 font-mono text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="text-md font-medium mb-3 flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-foreground" />
                      Tema Escuro
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="dark-primary">Cor Primária</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            id="dark-primary"
                            type="color"
                            value={hslToHex(themeColors.dark_primary || '0 0% 98%')}
                            onChange={(e) => updateThemeColor('dark_primary', e.target.value)}
                            className="w-16 h-10 cursor-pointer"
                          />
                          <Input
                            value={themeColors.dark_primary}
                            onChange={(e) => setThemeColors(prev => ({ ...prev, dark_primary: e.target.value }))}
                            placeholder="0 0% 98%"
                            className="flex-1 font-mono text-sm"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="dark-background">Cor de Fundo</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            id="dark-background"
                            type="color"
                            value={hslToHex(themeColors.dark_background || '240 10% 3.9%')}
                            onChange={(e) => updateThemeColor('dark_background', e.target.value)}
                            className="w-16 h-10 cursor-pointer"
                          />
                          <Input
                            value={themeColors.dark_background}
                            onChange={(e) => setThemeColors(prev => ({ ...prev, dark_background: e.target.value }))}
                            placeholder="240 10% 3.9%"
                            className="flex-1 font-mono text-sm"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="dark-foreground">Cor do Texto</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            id="dark-foreground"
                            type="color"
                            value={hslToHex(themeColors.dark_foreground || '0 0% 98%')}
                            onChange={(e) => updateThemeColor('dark_foreground', e.target.value)}
                            className="w-16 h-10 cursor-pointer"
                          />
                          <Input
                            value={themeColors.dark_foreground}
                            onChange={(e) => setThemeColors(prev => ({ ...prev, dark_foreground: e.target.value }))}
                            placeholder="0 0% 98%"
                            className="flex-1 font-mono text-sm"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="dark-button-primary">Botão Primário</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            id="dark-button-primary"
                            type="color"
                            value={hslToHex(themeColors.dark_button_primary || '195 85% 55%')}
                            onChange={(e) => updateThemeColor('dark_button_primary', e.target.value)}
                            className="w-16 h-10 cursor-pointer"
                          />
                          <Input
                            value={themeColors.dark_button_primary}
                            onChange={(e) => setThemeColors(prev => ({ ...prev, dark_button_primary: e.target.value }))}
                            placeholder="195 85% 55%"
                            className="flex-1 font-mono text-sm"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="dark-button-secondary">Botão Secundário</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            id="dark-button-secondary"
                            type="color"
                            value={hslToHex(themeColors.dark_button_secondary || '145 70% 55%')}
                            onChange={(e) => updateThemeColor('dark_button_secondary', e.target.value)}
                            className="w-16 h-10 cursor-pointer"
                          />
                          <Input
                            value={themeColors.dark_button_secondary}
                            onChange={(e) => setThemeColors(prev => ({ ...prev, dark_button_secondary: e.target.value }))}
                            placeholder="145 70% 55%"
                            className="flex-1 font-mono text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-muted/50">
                  <h4 className="text-sm font-medium mb-3">Preview de Botões</h4>
                  <div className="flex gap-3 flex-wrap">
                    <Button 
                      style={{
                        backgroundColor: `hsl(${themeColors.light_button_primary})`,
                        color: `hsl(${themeColors.light_button_primary_foreground})`,
                      }}
                      className="pointer-events-none"
                    >
                      <span>Botão Primário</span>
                    </Button>
                    <Button 
                      variant="secondary"
                      style={{
                        backgroundColor: `hsl(${themeColors.light_button_secondary})`,
                        color: `hsl(${themeColors.light_button_secondary_foreground})`,
                      }}
                      className="pointer-events-none"
                    >
                      <span>Botão Secundário</span>
                    </Button>
                  </div>
                </div>

                <Button onClick={saveThemeConfig} disabled={loading} className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Tema
                </Button>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {!isGlobal && (
          <Button variant="outline" onClick={() => navigate(`/session/${sessionId}?mode=pc`)}>
            <span>Voltar para Sessão</span>
          </Button>
        )}
        {isGlobal && (
          <Button variant="outline" onClick={() => navigate("/")}>
            <span>Voltar para Início</span>
          </Button>
        )}
      </div>
    </div>
  );
}
