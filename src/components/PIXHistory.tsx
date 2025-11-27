import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { formatCurrency } from '@/utils/pixGenerator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, Trash2 } from 'lucide-react';

interface PIXTransaction {
  id: string;
  amount: number;
  description: string | null;
  pix_code: string;
  created_at: string;
}

interface PIXHistoryProps {
  transactions: PIXTransaction[];
  onSelectTransaction?: (transaction: PIXTransaction) => void;
  onDeleteTransaction?: (transactionId: string) => void;
}

export function PIXHistory({ transactions, onSelectTransaction, onDeleteTransaction }: PIXHistoryProps) {
  if (transactions.length === 0) {
    return null;
  }

  return (
    <Card className="p-6 shadow-card">
      <h3 className="text-lg font-semibold mb-4">Histórico da sessão</h3>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="flex gap-2 items-stretch"
          >
            <button
              onClick={() => onSelectTransaction?.(tx)}
              className="flex-1 text-left p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-foreground">
                      {formatCurrency(tx.amount)}
                    </p>
                    <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                      <CheckCircle className="h-3 w-3" />
                      Confirmado
                    </Badge>
                  </div>
                  {tx.description && (
                    <p className="text-sm text-muted-foreground">
                      {tx.description}
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(tx.created_at), 'HH:mm', { locale: ptBR })}
                </p>
              </div>
            </button>
            
            {onDeleteTransaction && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-auto text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir pagamento?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir este pagamento de {formatCurrency(tx.amount)}?
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDeleteTransaction(tx.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
