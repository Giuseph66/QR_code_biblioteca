import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type AuthProviderProps = {
  children: React.ReactNode;
};

type AuthProviderState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

const initialState: AuthProviderState = {
  user: null,
  session: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
};

const AuthProviderContext = createContext<AuthProviderState>(initialState);

export function AuthProvider({ children, ...props }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Verificar sessão existente com tratamento de erro
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (mounted) {
          if (error) {
            // Se houver erro de rede/CORS, apenas logar e continuar sem sessão
            if (error.message?.includes('NetworkError') || 
                error.message?.includes('CORS') || 
                error.message?.includes('521')) {
              console.warn('⚠️ Não foi possível verificar a sessão. O projeto Supabase pode estar pausado.');
              // Limpar sessão local se houver erro de rede
              setSession(null);
              setUser(null);
            } else {
              console.error('Erro ao verificar sessão:', error);
            }
          } else {
            setSession(session);
            setUser(session?.user ?? null);
          }
          setLoading(false);
        }
      })
      .catch((error) => {
        if (mounted) {
          // Tratar erros de rede sem quebrar a aplicação
          if (error.message?.includes('NetworkError') || 
              error.message?.includes('CORS') || 
              error.message?.includes('521')) {
            console.warn('⚠️ Erro de rede ao verificar sessão. O projeto Supabase pode estar pausado.');
          } else {
            console.error('Erro inesperado ao verificar sessão:', error);
          }
          setSession(null);
          setUser(null);
          setLoading(false);
        }
      });

    // Ouvir mudanças no estado de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        // Ignorar eventos de erro de refresh token quando o servidor está indisponível
        if (event === 'TOKEN_REFRESHED' && !session) {
          // Se o refresh falhou, não atualizar o estado (manter sessão local se existir)
          return;
        }
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Melhorar mensagens de erro específicas
        let errorMessage = error.message;
        
        // Tratar erros 500 do servidor
        if (error.message?.includes('500') || error.message?.includes('unexpected_failure')) {
          errorMessage = 'Erro interno do servidor. O banco de dados pode estar com problemas. Tente novamente em alguns instantes ou verifique o status do Supabase.';
        }
        
        // Tratar erros de rede
        if (error.message?.includes('NetworkError') || error.message?.includes('CORS') || error.message?.includes('521')) {
          errorMessage = 'Não foi possível conectar ao servidor. Verifique se o projeto Supabase está ativo e não pausado.';
        }
        
        return { 
          error: new Error(errorMessage) 
        };
      }

      // Aguardar um pouco antes de atualizar o estado para evitar race conditions
      // Isso permite que o onAuthStateChange processe primeiro
      await new Promise(resolve => setTimeout(resolve, 50));
      
      setSession(data.session);
      setUser(data.user);
      return { error: null };
    } catch (error) {
      // Tratar erros inesperados
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Erro inesperado ao fazer login. Tente novamente.';
      
      return { error: new Error(errorMessage) };
    }
  };

  const signOut = async () => {
    try {
      // Usar scope 'local' para evitar o erro 403 de scope global
      // Isso limpa apenas a sessão local sem fazer requisição ao servidor
      try {
        const { error } = await supabase.auth.signOut({ scope: 'local' });
        if (error && !error.message.includes('session')) {
          // Apenas logar erros que não sejam relacionados à sessão ausente
          console.warn('Aviso ao fazer logout:', error.message);
        }
      } catch (apiError: any) {
        // Ignorar erros da API - vamos limpar localmente mesmo assim
        // Erros como "Auth session missing" são esperados se já limpamos o estado
        if (!apiError?.message?.includes('session')) {
          console.warn('Aviso ao fazer logout na API:', apiError);
        }
      }
      
      // Limpar estado local (isso pode fazer o onAuthStateChange disparar)
      setSession(null);
      setUser(null);
      
      // Limpar também o localStorage diretamente para garantir remoção completa
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.includes('supabase.auth')) {
            localStorage.removeItem(key);
          }
        });
      } catch (storageError) {
        // Ignorar erros de storage (pode não ter permissão em alguns casos)
        console.warn('Aviso ao limpar storage:', storageError);
      }
    } catch (error) {
      console.error('Erro inesperado ao fazer logout:', error);
      // Garantir que o estado local está limpo mesmo em caso de erro
      setSession(null);
      setUser(null);
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signOut,
  };

  return (
    <AuthProviderContext.Provider {...props} value={value}>
      {children}
    </AuthProviderContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthProviderContext);

  if (context === undefined)
    throw new Error("useAuth must be used within an AuthProvider");

  return context;
};

