import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
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

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-6 bg-background">
          <div className="text-center space-y-4 max-w-md">
            <AlertTriangle className="h-12 w-12 text-status-warning mx-auto" />
            <h1 className="text-xl font-bold">Etwas ist schiefgelaufen</h1>
            <p className="text-sm text-muted-foreground">
              {this.state.error?.message || "Ein unerwarteter Fehler ist aufgetreten."}
            </p>
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = "/today";
              }}
            >
              Zur Startseite
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
