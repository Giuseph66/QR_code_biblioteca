import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console em desenvolvimento
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary capturou um erro:", error, errorInfo);
    }
    
    // Se for o erro específico do insertBefore, tentar recarregar
    if (error.message?.includes('insertBefore') || error.name === 'NotFoundError') {
      // Aguardar um pouco antes de recarregar para evitar loops
      setTimeout(() => {
        if (window.location.pathname !== '/login') {
          window.location.reload();
        }
      }, 1000);
    }
  }

  render() {
    if (this.state.hasError) {
      // Se for erro de insertBefore, mostrar mensagem amigável
      if (this.state.error?.message?.includes('insertBefore') || this.state.error?.name === 'NotFoundError') {
        return (
          <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="text-center space-y-4 max-w-md">
              <h1 className="text-2xl font-bold">Carregando...</h1>
              <p className="text-muted-foreground">
                Aguarde enquanto a página é recarregada.
              </p>
            </div>
          </div>
        );
      }

      return this.props.fallback || (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-md">
            <h1 className="text-2xl font-bold">Algo deu errado</h1>
            <p className="text-muted-foreground">
              Ocorreu um erro inesperado. Por favor, recarregue a página.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
            >
              Recarregar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

