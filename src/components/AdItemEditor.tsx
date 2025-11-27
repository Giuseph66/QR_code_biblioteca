import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, GripVertical, Play, Image, Youtube } from 'lucide-react';
import { AdItem, detectAdType, extractYouTubeVideoId } from '@/types/ads';

interface AdItemEditorProps {
  item: AdItem;
  index: number;
  onChange: (index: number, item: AdItem) => void;
  onRemove: (index: number) => void;
}

export function AdItemEditor({ item, index, onChange, onRemove }: AdItemEditorProps) {
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (item.ad_type === 'youtube') {
      const videoId = extractYouTubeVideoId(item.url);
      if (videoId) {
        setPreviewUrl(`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`);
      }
    } else {
      setPreviewUrl(item.url);
    }
  }, [item.url, item.ad_type]);

  const handleUrlChange = (url: string) => {
    const adType = detectAdType(url);
    onChange(index, { ...item, url, ad_type: adType });
  };

  const getTypeIcon = () => {
    switch (item.ad_type) {
      case 'youtube':
        return <Youtube className="h-4 w-4 text-red-500" />;
      case 'video':
        return <Play className="h-4 w-4 text-blue-500" />;
      default:
        return <Image className="h-4 w-4 text-green-500" />;
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
        {getTypeIcon()}
        <span className="text-sm font-medium"><span>Anúncio {index + 1}</span></span>
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto text-destructive hover:text-destructive"
          onClick={() => onRemove(index)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4">
        <div>
          <Label><span>URL do anúncio</span></Label>
          <Input
            value={item.url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://exemplo.com/imagem.jpg ou link do YouTube"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label><span>Duração (segundos)</span></Label>
            <Input
              type="number"
              min={1}
              max={300}
              value={item.duration}
              onChange={(e) => onChange(index, { ...item, duration: parseInt(e.target.value) || 10 })}
            />
            {item.ad_type === 'youtube' && (
              <p className="text-xs text-muted-foreground mt-1">
                <span>0 = vídeo completo</span>
              </p>
            )}
          </div>

          <div>
            <Label><span>Ajuste de tela</span></Label>
            <Select
              value={item.fit_mode}
              onValueChange={(value: 'cover' | 'contain' | 'fill') => 
                onChange(index, { ...item, fit_mode: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contain"><span>Conter (mostra tudo)</span></SelectItem>
                <SelectItem value="cover"><span>Cobrir (preenche)</span></SelectItem>
                <SelectItem value="fill"><span>Esticar</span></SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {previewUrl && (
          <div className="mt-2">
            <Label className="mb-2 block"><span>Pré-visualização</span></Label>
            <div 
              className="relative bg-muted rounded-lg overflow-hidden"
              style={{ aspectRatio: '16/9', maxHeight: '150px' }}
            >
              {item.ad_type === 'youtube' ? (
                <img
                  src={previewUrl}
                  alt="Preview YouTube"
                  className="w-full h-full"
                  style={{ objectFit: item.fit_mode }}
                />
              ) : item.ad_type === 'video' ? (
                <video
                  src={previewUrl}
                  className="w-full h-full"
                  style={{ objectFit: item.fit_mode }}
                  muted
                />
              ) : (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full"
                  style={{ objectFit: item.fit_mode }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
