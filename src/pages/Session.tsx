import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PIXForm } from "@/components/PIXForm";
import { PIXDisplay } from "@/components/PIXDisplay";
import { PIXMobileDisplay } from "@/components/PIXMobileDisplay";
import { PIXHistory } from "@/components/PIXHistory";
import { SessionQRCode } from "@/components/SessionQRCode";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ArrowLeft, Trash2, Settings, CheckCircle, Moon } from "lucide-react";
import { generatePixPayload } from "@/utils/pixGenerator";
import { getSessionUrl } from "@/utils/sessionGenerator";
import { getPixConfig } from "@/utils/configHelper";
import { toast } from "@/hooks/use-toast";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface PIXTransaction {
  id: string;
  pix_code: string;
  amount: number;
  description: string | null;
  created_at: string;
}

export default function Session() {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = searchParams.get("mode") || "pc";
  const [currentPix, setCurrentPix] = useState<{
    pixCode: string;
    amount: number;
    description?: string;
  } | null>(null);
  const [transactions, setTransactions] = useState<PIXTransaction[]>([]);
  const [restMode, setRestMode] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  useEffect(() => {
    if (!sessionId) {
      navigate("/");
      return;
    }

    // Carregar transações existentes e modo descanso
    loadTransactions();
    loadRestMode();

    const channel = supabase
      .channel(`pix-session-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "pix_transactions",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newPix = payload.new as PIXTransaction;
          // Apenas atualiza o histórico, não o PIX atual
          setTransactions(prev => {
            if (prev.some(t => t.id === newPix.id)) return prev;
            return [newPix, ...prev];
          });
        }
      )
      .on(
        "broadcast",
        { event: "pix_generated" },
        (payload) => {
          const { pixCode, amount, description } = payload.payload;
          setCurrentPix({ pixCode, amount, description });
        }
      )
      .on(
        "broadcast",
        { event: "pix_cleared" },
        () => {
          setCurrentPix(null);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, navigate]);

  const loadTransactions = async () => {
    if (!sessionId) return;

    try {
      const { data, error } = await supabase
        .from("pix_transactions")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error loading transactions:", error);
    }
  };

  const loadRestMode = async () => {
    if (!sessionId) return;
    
    try {
      const { data } = await supabase
        .from("sessions")
        .select("rest_mode")
        .eq("id", sessionId)
        .single();
      
      if (data) {
        setRestMode(data.rest_mode || false);
      }
    } catch (error) {
      console.error("Error loading rest mode:", error);
    }
  };

  const handlePixGenerated = async (amount: number, description: string) => {
    if (!sessionId) return;

    try {
      // Busca configuração da sessão ou global
      const pixConfig = await getPixConfig(sessionId);

      if (!pixConfig) {
        toast({
          title: "Configure a chave PIX",
          description: "Acesse as configurações para definir sua chave PIX.",
          variant: "destructive",
        });
        return;
      }

      const pixCode = generatePixPayload({
        pixKey: pixConfig.pix_key,
        amount,
        merchantName: pixConfig.recipient_name,
        merchantCity: pixConfig.recipient_city,
        description: description || undefined,
        txid: `TX${Date.now()}`,
      });

      const pixData = { pixCode, amount, description: description || undefined };
      setCurrentPix(pixData);

      // Broadcast para o mobile receber imediatamente
      channelRef.current?.send({
        type: "broadcast",
        event: "pix_generated",
        payload: pixData,
      });
    } catch (error) {
      console.error("Error generating PIX:", error);
      toast({
        title: "Erro",
        description: "Erro ao gerar PIX. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleClearPix = () => {
    setCurrentPix(null);
    // Broadcast para o mobile limpar também
    channelRef.current?.send({
      type: "broadcast",
      event: "pix_cleared",
      payload: {},
    });
  };

  const handleConfirmPix = async () => {
    if (!currentPix || !sessionId) return;
    
    try {
      // Salva a transação confirmada no banco e retorna os dados
      const { data, error } = await supabase
        .from("pix_transactions")
        .insert({
          session_id: sessionId,
          pix_code: currentPix.pixCode,
          amount: currentPix.amount,
          description: currentPix.description || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Atualiza histórico localmente de imediato
      if (data) {
        setTransactions(prev => [data as PIXTransaction, ...prev]);
      }

      toast({
        title: "PIX Confirmado",
        description: "Pagamento marcado como recebido!",
      });
      
      // Limpa o PIX após confirmação e avisa o mobile
      setTimeout(() => {
        setCurrentPix(null);
        // Broadcast para o mobile voltar a exibir anúncios
        channelRef.current?.send({
          type: "broadcast",
          event: "pix_cleared",
          payload: {},
        });
      }, 2000);
    } catch (error) {
      console.error("Error confirming PIX:", error);
      toast({
        title: "Erro",
        description: "Erro ao confirmar PIX.",
        variant: "destructive",
      });
    }
  };

  const handleSelectTransaction = (transaction: PIXTransaction) => {
    setCurrentPix({
      pixCode: transaction.pix_code,
      amount: transaction.amount,
      description: transaction.description || undefined,
    });
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      const { error } = await supabase
        .from("pix_transactions")
        .delete()
        .eq("id", transactionId);

      if (error) throw error;

      // Remove da lista local
      setTransactions(prev => prev.filter(tx => tx.id !== transactionId));

      toast({
        title: "Pagamento excluído",
        description: "O pagamento foi removido do histórico.",
      });
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir pagamento.",
        variant: "destructive",
      });
    }
  };

  const toggleRestMode = async () => {
    if (!sessionId) return;
    
    try {
      const newRestMode = !restMode;
      const { error } = await supabase
        .from("sessions")
        .update({ rest_mode: newRestMode })
        .eq("id", sessionId);

      if (error) throw error;
      
      setRestMode(newRestMode);
      toast({
        title: newRestMode ? "Modo descanso ativado" : "Modo descanso desativado",
        description: newRestMode 
          ? "O painel mobile mostrará tela preta quando não houver PIX."
          : "O painel mobile voltará a exibir anúncios.",
      });
    } catch (error) {
      console.error("Error toggling rest mode:", error);
      toast({
        title: "Erro",
        description: "Erro ao alterar modo descanso.",
        variant: "destructive",
      });
    }
  };

  if (mode === "mobile") {
    return (
      <PIXMobileDisplay sessionId={sessionId!} currentPix={currentPix} />
    );
  }

  const sessionUrl = getSessionUrl(sessionId!);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b flex items-center px-4 gap-4">
            <SidebarTrigger />
            <div className="flex items-center gap-4 flex-1">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <h1 className="text-xl font-bold">Painel de Controle PIX</h1>
                <p className="text-xs text-muted-foreground">
                  Sessão: {sessionId}
                </p>
              </div>
              <Button
                variant={restMode ? "default" : "outline"}
                size="icon"
                onClick={toggleRestMode}
                title={restMode ? "Desativar modo descanso" : "Ativar modo descanso"}
              >
                <Moon className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate(`/config?session=${sessionId}`)}
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </header>

          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              <SessionQRCode sessionUrl={sessionUrl} sessionId={sessionId!} />

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <PIXForm onGeneratePix={handlePixGenerated} />
                  {currentPix && (
                    <div className="space-y-3">
                      <Button
                        className="w-full bg-gradient-success hover:opacity-90"
                        onClick={handleConfirmPix}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Confirmar Pagamento
                      </Button>
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={handleClearPix}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Limpar PIX
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {currentPix ? (
                    <PIXDisplay
                      pixCode={currentPix.pixCode}
                      amount={currentPix.amount}
                      description={currentPix.description}
                    />
                  ) : (
                    <Card className="p-8 flex items-center justify-center h-64">
                      <p className="text-muted-foreground">
                        Nenhum PIX gerado
                      </p>
                    </Card>
                  )}
                </div>
              </div>

              <PIXHistory
                transactions={transactions}
                onSelectTransaction={handleSelectTransaction}
                onDeleteTransaction={handleDeleteTransaction}
              />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
