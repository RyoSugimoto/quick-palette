import { Component, type ComponentChildren } from "preact";

interface ErrorBoundaryProps {
  readonly children: ComponentChildren;
}

interface ErrorBoundaryState {
  readonly failed: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(): void {
    // Rendering errors are replaced with the local recovery UI below.
  }

  render() {
    if (this.state.failed) {
      return (
        <main class="fatal-error">
          <h1>Quick Palette could not continue</h1>
          <p>Reload the application to start again.</p>
          <button type="button" onClick={() => window.location.reload()}>Reload Quick Palette</button>
        </main>
      );
    }
    return this.props.children;
  }
}
