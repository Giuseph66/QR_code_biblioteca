import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Copy, Check, Sun, Moon, Maximize, Minimize } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/pixGenerator';
import { useTheme } from '@/providers/ThemeProvider';
import { YouTubeEmbed } from '@/components/YouTubeEmbed';
import { AdItem, extractYouTubeVideoId } from '@/types/ads';

interface PIXMobileDisplayProps {
  sessionId: string;
  currentPix: { pixCode: string; amount: number; description?: string } | null;
}

export function PIXMobileDisplay({ sessionId, currentPix }: PIXMobileDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [adItems, setAdItems] = useState<AdItem[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [restMode, setRestMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    loadAds();
    loadRestMode();
    
    // Subscribe to rest_mode changes
    const channel = supabase
      .channel(`session-rest-mode-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.new && 'rest_mode' in payload.new) {
            setRestMode(payload.new.rest_mode as boolean);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  // Handle ad rotation based on individual duration
  useEffect(() => {
    if (adItems.length <= 1 || currentPix || restMode) return;

    const currentAd = adItems[currentAdIndex];
    if (!currentAd) return;

    // For YouTube videos with duration 0, we don't auto-advance
    if (currentAd.ad_type === 'youtube' && currentAd.duration === 0) return;

    const duration = currentAd.duration * 1000;
    const timer = setTimeout(() => {
      setCurrentAdIndex((prev) => (prev + 1) % adItems.length);
    }, duration);

    return () => clearTimeout(timer);
  }, [adItems, currentAdIndex, currentPix, restMode]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const loadAds = async () => {
    try {
      // First try to get ads_config for this session
      let adsConfigId: string | null = null;

      const { data: sessionConfig } = await supabase
        .from('ads_config')
        .select('id, ads')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (sessionConfig) {
        adsConfigId = sessionConfig.id;
        // Check if there are ad_items for this config
        const { data: items } = await supabase
          .from('ad_items')
          .select('*')
          .eq('ads_config_id', adsConfigId)
          .order('sort_order');

        if (items && items.length > 0) {
          setAdItems(items as AdItem[]);
          return;
        }

        // Fallback to legacy ads array
        if (sessionConfig.ads && Array.isArray(sessionConfig.ads)) {
          const legacyAds = (sessionConfig.ads as string[]).map((url, i) => ({
            url,
            ad_type: detectLegacyAdType(url),
            duration: 10,
            fit_mode: 'contain' as const,
            sort_order: i,
          }));
          setAdItems(legacyAds);
          return;
        }
      }

      // Try global config
      const { data: globalConfig } = await supabase
        .from('ads_config')
        .select('id, ads')
        .is('session_id', null)
        .maybeSingle();

      if (globalConfig) {
        adsConfigId = globalConfig.id;
        const { data: items } = await supabase
          .from('ad_items')
          .select('*')
          .eq('ads_config_id', adsConfigId)
          .order('sort_order');

        if (items && items.length > 0) {
          setAdItems(items as AdItem[]);
          return;
        }

        // Fallback to legacy ads array
        if (globalConfig.ads && Array.isArray(globalConfig.ads)) {
          const legacyAds = (globalConfig.ads as string[]).map((url, i) => ({
            url,
            ad_type: detectLegacyAdType(url),
            duration: 10,
            fit_mode: 'contain' as const,
            sort_order: i,
          }));
          setAdItems(legacyAds);
        }
      }
    } catch (error) {
      console.error('Error loading ads:', error);
    }
  };

  const detectLegacyAdType = (url: string): 'image' | 'video' | 'youtube' => {
    if (extractYouTubeVideoId(url)) return 'youtube';
    if (url.match(/\.(mp4|webm|ogg)$/i)) return 'video';
    return 'image';
  };

  const loadRestMode = async () => {
    try {
      const { data } = await supabase
        .from('sessions')
        .select('rest_mode')
        .eq('id', sessionId)
        .single();

      if (data) {
        setRestMode(data.rest_mode || false);
      }
    } catch (error) {
      console.error('Error loading rest mode:', error);
    }
  };

  const copyPixCode = async () => {
    if (!currentPix) return;
    await navigator.clipboard.writeText(currentPix.pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  const handleAdEnded = useCallback(() => {
    setCurrentAdIndex((prev) => (prev + 1) % adItems.length);
  }, [adItems.length]);

  const renderAd = (ad: AdItem) => {
    const fitStyle = {
      objectFit: ad.fit_mode as React.CSSProperties['objectFit'],
    };

    if (ad.ad_type === 'youtube') {
      return (
        <YouTubeEmbed
          url={ad.url}
          duration={ad.duration}
          fitMode={ad.fit_mode}
          onEnded={handleAdEnded}
        />
      );
    }

    if (ad.ad_type === 'video') {
      return (
        <video
          src={ad.url}
          autoPlay
          loop
          muted
          playsInline
          className="max-w-full max-h-screen w-full h-full"
          style={fitStyle}
          onEnded={handleAdEnded}
        />
      );
    }

    return (
      <img
        src={ad.url}
        alt="Anúncio"
        className="max-w-full max-h-screen w-full h-full"
        style={fitStyle}
      />
    );
  };

  const TopButtons = () => (
    <div className="absolute top-4 right-4 flex gap-2 z-10">
      <Button
        variant="outline"
        size="icon"
        onClick={toggleFullscreen}
        className="bg-background/80 backdrop-blur-sm"
      >
        {isFullscreen ? (
          <Minimize className="h-5 w-5" />
        ) : (
          <Maximize className="h-5 w-5" />
        )}
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={toggleTheme}
        className="bg-background/80 backdrop-blur-sm"
      >
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>
    </div>
  );

  const Watermark = () => (
    <div className="absolute bottom-4 right-4 flex items-center gap-1.5 z-10 opacity-50">
      <img 
        src="/neurelix-logo.png" 
        alt="Neurelix" 
        className="h-5 w-5"
      />
      <span className="text-xs font-medium text-foreground/70">Neurelix</span>
    </div>
  );

  // PIX Display
  if (currentPix) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative">
        <TopButtons />

        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Escaneie o QR Code para pagar
            </p>
            <p className="text-5xl font-bold text-secondary">
              {formatCurrency(currentPix.amount)}
            </p>
            {currentPix.description && (
              <p className="text-base text-muted-foreground">
                {currentPix.description}
              </p>
            )}
          </div>

          <div className="flex justify-center p-8 bg-white rounded-2xl shadow-floating">
            <QRCodeSVG 
              value={currentPix.pixCode} 
              size={280}
              level="M"
              includeMargin={false}
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>

          <Button
            onClick={copyPixCode}
            className="w-full bg-gradient-success hover:opacity-90 transition-opacity py-6 text-lg"
            size="lg"
          >
            {copied ? (
              <>
                <Check className="mr-2 h-5 w-5" />
                Código copiado!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-5 w-5" />
                Copiar código PIX
              </>
            )}
          </Button>
        </div>
        <Watermark />
      </div>
    );
  }

  // Rest mode - black screen
  if (restMode) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center relative">
        <TopButtons />
        <Watermark />
      </div>
    );
  }

  // No ads - waiting screen
  if (adItems.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative">
        <TopButtons />
        <div className="text-center space-y-4">
          <p className="text-lg text-muted-foreground">
            Aguardando PIX ser gerado...
          </p>
        </div>
        <Watermark />
      </div>
    );
  }

  // Show ads
  const currentAd = adItems[currentAdIndex];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
      <TopButtons />
      <div className="w-full h-screen flex items-center justify-center">
        {renderAd(currentAd)}
      </div>
      <Watermark />
    </div>
  );
}
