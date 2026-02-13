import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "2rem", textAlign: "center", fontFamily: "sans-serif" }}>
          <h1>⚠️ Something went wrong</h1>
          <p>Please refresh the page.</p>
          <pre style={{ background: "#f0f0f0", padding: "1rem", borderRadius: "8px", textAlign: "left", overflow: "auto" }}>
            {this.state.error?.message}
          </pre>
          <button onClick={() => window.location.reload()} style={{ padding: "0.5rem 1rem", marginTop: "1rem" }}>
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;