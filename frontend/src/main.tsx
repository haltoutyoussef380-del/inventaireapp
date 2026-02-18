import { StrictMode, Component, ErrorInfo, ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// GLOBAL ERROR TRAP
window.onerror = function (msg, url, lineNo, columnNo, error) {
  const errorMessage = `
    <div style="background:red; color:white; padding:20px; font-size:16px; position:fixed; top:0; left:0; width:100%; z-index:9999;">
      <h1>CRITICAL ERROR</h1>
      <p><strong>Message:</strong> ${msg}</p>
      <p><strong>Location:</strong> ${url}:${lineNo}:${columnNo}</p>
      <p><strong>Stack:</strong> ${error?.stack}</p>
    </div>
  `;
  document.body.innerHTML += errorMessage;
  console.error("Global error caught:", error);
  return false;
};

window.onunhandledrejection = function (event) {
  const errorMessage = `
    <div style="background:darkred; color:white; padding:20px; font-size:16px; position:fixed; bottom:0; left:0; width:100%; z-index:9999;">
      <h1>UNHANDLED PROMISE REJECTION</h1>
      <p><strong>Reason:</strong> ${event.reason}</p>
    </div>
  `;
  document.body.innerHTML += errorMessage;
  console.error("Unhandled rejection:", event.reason);
};

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', fontFamily: 'monospace' }}>
          <h1>React Info: Something went wrong.</h1>
          <pre>{this.state.error?.toString()}</pre>
          <pre>{this.state.error?.stack}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
