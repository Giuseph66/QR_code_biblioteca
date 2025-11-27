import { useEffect, useRef, useState } from 'react';
import { extractYouTubeVideoId } from '@/types/ads';

interface YouTubeEmbedProps {
  url: string;
  duration: number; // 0 = full video
  fitMode: 'cover' | 'contain' | 'fill';
  onEnded?: () => void;
}

export function YouTubeEmbed({ url, duration, fitMode, onEnded }: YouTubeEmbedProps) {
  const videoId = extractYouTubeVideoId(url);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [key, setKey] = useState(0);

  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // If duration > 0, set a timer to call onEnded
    if (duration > 0 && onEnded) {
      timerRef.current = setTimeout(() => {
        onEnded();
      }, duration * 1000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [duration, onEnded, key]);

  // Reset key when url changes to force iframe reload
  useEffect(() => {
    setKey(prev => prev + 1);
  }, [url]);

  if (!videoId) {
    return (
      <div className="flex items-center justify-center h-full bg-muted">
        <p className="text-muted-foreground">URL do YouTube inválida</p>
      </div>
    );
  }

  // Build YouTube embed URL with autoplay, mute, no controls
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&showinfo=0&loop=1&playlist=${videoId}`;

  const getObjectFit = () => {
    switch (fitMode) {
      case 'cover':
        return 'cover';
      case 'fill':
        return 'fill';
      default:
        return 'contain';
    }
  };

  return (
    <div 
      className="w-full h-full overflow-hidden"
      style={{
        position: 'relative',
      }}
    >
      <iframe
        key={key}
        src={embedUrl}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 w-full h-full border-0"
        style={{
          objectFit: getObjectFit(),
          // Scale iframe to cover the container when using cover mode
          ...(fitMode === 'cover' ? {
            width: '150%',
            height: '150%',
            top: '-25%',
            left: '-25%',
          } : {})
        }}
      />
    </div>
  );
}
