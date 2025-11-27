import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { evaluateExpression, isExpression } from '@/utils/mathParser';

interface PIXFormProps {
  onGeneratePix: (amount: number, description: string) => Promise<void>;
}

export function PIXForm({ onGeneratePix }: PIXFormProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const calculateAmount = () => {
    const result = evaluateExpression(amount);
    if (result) {
      setAmount(result);
      return result;
    }
    return amount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Tenta calcular caso haja uma expressão pendente
    const finalAmountStr = calculateAmount();
    const numAmount = parseFloat(finalAmountStr.replace(',', '.'));
    
    if (isNaN(numAmount) || numAmount <= 0) {
      return;
    }

    setIsLoading(true);
    try {
      await onGeneratePix(numAmount, description);
      setDescription('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Permite números, vírgula, ponto, operadores, parênteses e espaços
    const value = e.target.value.replace(/[^\d,.\+\-\*\/x\(\)\s]/gi, '');
    setAmount(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && isExpression(amount)) {
      e.preventDefault(); // Impede o submit se for para calcular
      calculateAmount();
    }
  };

  return (
    <Card className="p-6 shadow-card">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-4">Gerar novo PIX</h3>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="amount">Valor (R$) *</Label>
          <Input
            id="amount"
            type="text"
            placeholder="0,00 ou cálculo (ex: 10 * 5)"
            value={amount}
            onChange={handleAmountChange}
            onKeyDown={handleKeyDown}
            onBlur={() => calculateAmount()}
            required
            className="text-lg"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição (opcional)</Label>
          <Input
            id="description"
            type="text"
            placeholder="Ex: Pedido 123"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={50}
          />
        </div>

        <Button 
          type="submit" 
          className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
          size="lg"
          disabled={isLoading || !amount}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Gerando...</span>
            </>
          ) : (
            <span>Gerar PIX</span>
          )}
        </Button>
      </form>
    </Card>
  );
}
