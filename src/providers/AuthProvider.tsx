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

    // Verificar sessão existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    // Ouvir mudanças no estado de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
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
        return { error };
      }

      // Aguardar um pouco antes de atualizar o estado para evitar race conditions
      // Isso permite que o onAuthStateChange processe primeiro
      await new Promise(resolve => setTimeout(resolve, 50));
      
      setSession(data.session);
      setUser(data.user);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
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

