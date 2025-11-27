import { QRCodeSVG } from 'qrcode.react';
import { Card } from '@/components/ui/card';

interface SessionQRCodeProps {
  sessionUrl: string;
  sessionId: string;
}

export function SessionQRCode({ sessionUrl, sessionId }: SessionQRCodeProps) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(sessionUrl);
  };

  return (
    <Card className="p-6 shadow-card">
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Sessão Ativa
          </h3>
          <p className="text-3xl font-bold text-primary">
            {sessionId}
          </p>
        </div>
        
        <div className="flex justify-center p-4 bg-background rounded-lg">
          <QRCodeSVG 
            value={sessionUrl} 
            size={120}
            level="M"
            includeMargin={false}
          />
        </div>
        
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground text-center">
            Aponte a câmera do celular para acessar
          </p>
          <button
            onClick={copyToClipboard}
            className="w-full text-sm text-primary hover:text-primary/80 transition-colors"
          >
            Copiar link da sessão
          </button>
        </div>
      </div>
    </Card>
  );
}
