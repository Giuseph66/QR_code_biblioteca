import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Calendar, DollarSign, Trash2, ArrowUpDown } from "lucide-react";
import { formatCurrency } from "@/utils/pixGenerator";
import { toast } from "@/hooks/use-toast";

interface SessionData {
  id: string;
  created_at: string;
  total_transactions: number;
  total_amount: number;
}

type SortOption = "date-desc" | "date-asc" | "transactions-desc" | "transactions-asc" | "amount-desc" | "amount-asc";

export default function Dashboard() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      
      // Buscar todas as sessões
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("sessions")
        .select("id, created_at")
        .order("created_at", { ascending: false });

      if (sessionsError) throw sessionsError;

      // Para cada sessão, buscar as transações
      const sessionsWithData = await Promise.all(
        (sessionsData || []).map(async (session) => {
          const { data: transactions } = await supabase
            .from("pix_transactions")
            .select("amount")
            .eq("session_id", session.id);

          const totalAmount = transactions?.reduce(
            (sum, t) => sum + Number(t.amount),
            0
          ) || 0;

          return {
            id: session.id,
            created_at: session.created_at,
            total_transactions: transactions?.length || 0,
            total_amount: totalAmount,
          };
        })
      );

      setSessions(sessionsWithData);
    } catch (error) {
      console.error("Error loading sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      // Deletar transações da sessão primeiro
      await supabase
        .from("pix_transactions")
        .delete()
        .eq("session_id", sessionId);

      // Deletar configurações PIX da sessão
      await supabase
        .from("pix_config")
        .delete()
        .eq("session_id", sessionId);

      // Deletar configurações de anúncios da sessão
      await supabase
        .from("ads_config")
        .delete()
        .eq("session_id", sessionId);

      // Deletar a sessão
      const { error } = await supabase
        .from("sessions")
        .delete()
        .eq("id", sessionId);

      if (error) throw error;

      // Remover da lista local
      setSessions(prev => prev.filter(s => s.id !== sessionId));

      toast({
        title: "Sessão excluída",
        description: "A sessão e todos os seus dados foram removidos.",
      });
    } catch (error) {
      console.error("Error deleting session:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir sessão.",
        variant: "destructive",
      });
    }
  };

  const sortedSessions = [...sessions].sort((a, b) => {
    switch (sortBy) {
      case "date-desc":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "date-asc":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case "transactions-desc":
        return b.total_transactions - a.total_transactions;
      case "transactions-asc":
        return a.total_transactions - b.total_transactions;
      case "amount-desc":
        return b.total_amount - a.total_amount;
      case "amount-asc":
        return a.total_amount - b.total_amount;
      default:
        return 0;
    }
  });

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
                <h1 className="text-xl font-bold"><span>Painel de Sessões</span></h1>
                <p className="text-xs text-muted-foreground">
                  <span>Histórico e movimentações</span>
                </p>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {!loading && sessions.length > 0 && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 flex-1">
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Ordenar por:</span>
                  </div>
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date-desc"><span>Data (mais recente)</span></SelectItem>
                      <SelectItem value="date-asc"><span>Data (mais antiga)</span></SelectItem>
                      <SelectItem value="transactions-desc"><span>Quantidade (maior)</span></SelectItem>
                      <SelectItem value="transactions-asc"><span>Quantidade (menor)</span></SelectItem>
                      <SelectItem value="amount-desc"><span>Valor (maior)</span></SelectItem>
                      <SelectItem value="amount-asc"><span>Valor (menor)</span></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {loading ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground"><span>Carregando sessões...</span></p>
                </Card>
              ) : sessions.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">
                    <span>Nenhuma sessão encontrada</span>
                  </p>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {sortedSessions.map((session) => (
                    <Card
                      key={session.id}
                      className="p-6 space-y-4 hover:shadow-lg transition-shadow cursor-pointer group relative"
                      onClick={() => navigate(`/session/${session.id}?mode=pc`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-2xl font-bold text-primary">
                          {session.id}
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle><span>Excluir sessão?</span></AlertDialogTitle>
                              <AlertDialogDescription>
                                <span>Tem certeza que deseja excluir a sessão <strong>{session.id}</strong>?</span>
                                <span>Todas as transações e configurações desta sessão serão permanentemente removidas.</span>
                                <span>Esta ação não pode ser desfeita.</span>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel><span>Cancelar</span></AlertDialogCancel>
                              <AlertDialogAction
                                onClick={(e) => handleDeleteSession(session.id, e)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                <span>Excluir</span>
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {formatDate(session.created_at)}
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-sm text-muted-foreground">
                            <span>PIX Confirmados</span>
                          </span>
                          <span className="text-lg font-semibold text-secondary">
                            {session.total_transactions}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            <span>Total Recebido</span>
                          </span>
                          <span className="text-lg font-bold text-primary">
                            {formatCurrency(session.total_amount)}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
