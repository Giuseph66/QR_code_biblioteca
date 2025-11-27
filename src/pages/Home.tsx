import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { generateSessionId } from '@/utils/sessionGenerator';
import { Loader2, QrCode, LogIn, LayoutDashboard, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const [sessionInput, setSessionInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const createSession = async () => {
    setIsCreating(true);
    try {
      const sessionId = generateSessionId();
      
      const { error } = await supabase
        .from('sessions')
        .insert({ id: sessionId, active: true });

      if (error) throw error;

      navigate(`/session/${sessionId}?mode=pc`);
    } catch (error) {
      console.error('Erro ao criar sessão:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a sessão. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const joinSession = async () => {
    if (!sessionInput.trim()) return;

    setIsJoining(true);
    try {
      const formattedId = sessionInput.toUpperCase().trim();
      
      const { data, error } = await supabase
        .from('sessions')
        .select('id')
        .eq('id', formattedId)
        .single();

      if (error || !data) {
        toast({
          title: 'Sessão não encontrada',
          description: 'Verifique o código e tente novamente.',
          variant: 'destructive',
        });
        return;
      }

      navigate(`/session/${formattedId}?mode=mobile`);
    } catch (error) {
      console.error('Erro ao entrar na sessão:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível entrar na sessão. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-block p-4 bg-gradient-primary rounded-2xl mb-4">
            <QrCode className="h-12 w-12 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold"><span>PIX QR</span></h1>
          <p className="text-muted-foreground">
            <span>Gere e compartilhe códigos PIX em tempo real</span>
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
            className="flex-1"
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Painel</span>
          </Button>
          <Button
            onClick={() => navigate('/config?global=true')}
            variant="outline"
            className="flex-1"
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Config Global</span>
          </Button>
        </div>

        <Card className="p-6 shadow-floating space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2"><span>Criar nova sessão</span></h2>
            <p className="text-sm text-muted-foreground mb-4">
              <span>Comece uma nova sessão para gerar PIX no PC</span>
            </p>
            <Button
              onClick={createSession}
              disabled={isCreating}
              className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
              size="lg"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Criando...</span>
                </>
              ) : (
                <span>Criar sessão</span>
              )}
            </Button>
          </div>
        </Card>

        <Card className="p-6 shadow-floating space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2"><span>Entrar em sessão</span></h2>
            <p className="text-sm text-muted-foreground mb-4">
              <span>Digite o código ou escaneie o QR Code no celular</span>
            </p>
            <div className="space-y-3">
              <div>
                <Label htmlFor="session-code"><span>Código da sessão</span></Label>
                <Input
                  id="session-code"
                  type="text"
                  placeholder="XXXX-XX"
                  value={sessionInput}
                  onChange={(e) => setSessionInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && joinSession()}
                  maxLength={7}
                  className="text-center text-lg tracking-wider"
                />
              </div>
              <Button
                onClick={joinSession}
                disabled={isJoining || !sessionInput.trim()}
                variant="secondary"
                className="w-full"
                size="lg"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Entrando...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    <span>Entrar</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
