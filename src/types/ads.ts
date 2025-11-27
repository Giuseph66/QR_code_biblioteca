export interface AdItem {
  id?: string;
  url: string;
  ad_type: 'image' | 'video' | 'youtube';
  duration: number;
  fit_mode: 'cover' | 'contain' | 'fill';
  sort_order: number;
}

export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

export function detectAdType(url: string): 'image' | 'video' | 'youtube' {
  if (extractYouTubeVideoId(url)) {
    return 'youtube';
  }
  if (url.match(/\.(mp4|webm|ogg)$/i)) {
    return 'video';
  }
  return 'image';
}
