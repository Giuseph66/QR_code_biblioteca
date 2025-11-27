import { QRCodeSVG } from 'qrcode.react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { formatCurrency } from '@/utils/pixGenerator';

interface PIXDisplayProps {
  pixCode: string;
  amount: number;
  description?: string;
}

export function PIXDisplay({ pixCode, amount, description }: PIXDisplayProps) {
  const [copied, setCopied] = useState(false);

  const copyPixCode = async () => {
    await navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="p-6 shadow-card">
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">
            PIX Gerado
          </h3>
          <p className="text-4xl font-bold text-secondary">
            {formatCurrency(amount)}
          </p>
          {description && (
            <p className="text-sm text-muted-foreground mt-2">
              {description}
            </p>
          )}
        </div>

        <div className="flex justify-center p-6 bg-white rounded-lg">
          <QRCodeSVG 
            value={pixCode} 
            size={200}
            level="M"
            includeMargin={false}
            bgColor="#ffffff"
            fgColor="#000000"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Código PIX Copia e Cola:
          </Label>
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs font-mono break-all text-muted-foreground">
              {pixCode}
            </p>
          </div>
        </div>

        <Button
          onClick={copyPixCode}
          className="w-full bg-gradient-success hover:opacity-90 transition-opacity"
          size="lg"
        >
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              Copiar código PIX
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}
