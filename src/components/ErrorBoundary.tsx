import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
  onDomMutationError?: () => void;
}

interface State {
  hasError: boolean;
  isDomMutation: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, isDomMutation: false };

  static getDerivedStateFromError(error: Error): State {
    const isDomMutation =
      error.message?.includes("insertBefore") ||
      error.message?.includes("removeChild") ||
      error.message?.includes("not a child of this node");

    return { hasError: true, isDomMutation };
  }

  componentDidCatch(error: Error) {
    const isDomMutation =
      error.message?.includes("insertBefore") ||
      error.message?.includes("removeChild") ||
      error.message?.includes("not a child of this node");

    if (isDomMutation) {
      // Avisa o pai para pular/fechar o componente problemático
      this.props.onDomMutationError?.();
      return;
    }

    this.props.onError?.(error);
    console.error("[ErrorBoundary]", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
