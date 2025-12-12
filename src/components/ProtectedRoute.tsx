import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";
import { Loader2 } from "lucide-react";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasRedirectedRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const stableKeyRef = useRef(0);

  // Aguardar um ciclo de renderização completo antes de considerar pronto
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  useEffect(() => {
    // Limpar timer anterior se existir
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }

    // Aguardar a verificação de autenticação terminar E estar pronto
    if (isReady && !loading && !user && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      
      // Usar requestIdleCallback ou setTimeout com delay maior
      // para garantir que todas as extensões terminaram de manipular o DOM
      const performRedirect = () => {
        try {
          // Usar window.location como método mais seguro para Chrome
          const currentPath = location.pathname + location.search;
          const loginUrl = currentPath !== '/' 
            ? `/login?redirect=${encodeURIComponent(currentPath)}`
            : '/login';
          
          // Tentar navigate primeiro, mas com fallback mais robusto
          navigate("/login", { 
            state: { from: location }, 
            replace: true 
          });
          
          // Se após um tempo ainda estiver na mesma página, forçar reload
          setTimeout(() => {
            if (window.location.pathname !== '/login') {
              window.location.href = loginUrl;
            }
          }, 500);
        } catch (error) {
          console.error('Erro ao redirecionar:', error);
          window.location.href = '/login';
        }
      };

      // Usar setTimeout com delay maior para garantir que extensões terminaram
      // de manipular o DOM (especialmente no Chrome)
      redirectTimerRef.current = setTimeout(performRedirect, 300);
    }
    
    // Reset quando usuário faz login
    if (user && hasRedirectedRef.current) {
      hasRedirectedRef.current = false;
      stableKeyRef.current += 1; // Forçar re-renderização estável
    }

    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
    };
  }, [user, loading, navigate, location, isReady]);

  // Memoizar o componente de loading para evitar re-renderizações
  const loadingComponent = useMemo(
    () => (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">
            {loading ? 'Carregando...' : 'Redirecionando...'}
          </p>
        </div>
      </div>
    ),
    [loading]
  );

  // Mostrar loading enquanto verifica autenticação ou não está pronto
  if (loading || !isReady) {
    return loadingComponent;
  }

  // Se não autenticado após verificação, mostrar loading enquanto redireciona
  if (!user) {
    return loadingComponent;
  }

  // Se autenticado, renderizar o componente filho com key estável
  // Isso evita que o React tente reutilizar nós que podem ter sido manipulados
  return (
    <div key={`protected-${stableKeyRef.current}`} style={{ minHeight: '100vh' }}>
      {children}
    </div>
  );
}

