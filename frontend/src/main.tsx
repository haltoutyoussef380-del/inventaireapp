import { StrictMode, Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { StatusBar } from '@capacitor/status-bar';
import './index.css'
import App from './App.tsx'

// Diagnostic tool
const showFatalError = (msg: string, detail?: string) => {
  const div = document.createElement("div");
  div.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;color:white;background:red;z-index:99999;padding:20px;font-family:monospace;white-space:pre-wrap;overflow:auto;display:block !important;";
  div.innerHTML = `<h1>CRITICAL JS ERROR</h1><p style='font-size:18px'>${msg}</p><hr/><pre>${detail || ''}</pre>`;
  document.body.innerHTML = ''; // Clear everything
  document.body.appendChild(div);
  console.error("Fatal Error:", msg, detail);
};

// Global Catch-all
window.onerror = (msg, url, line, col, error) => {
  showFatalError(String(msg), `${url}:${line}:${col}\n\n${error?.stack || ''}`);
  return false;
};

window.onunhandledrejection = (event) => {
  showFatalError("Unhandled Promise Rejection", String(event.reason));
};

try {
  console.log("V3.2 - STARTING APP INITIALIZATION");

  // Hide StatusBar for true full screen
  if (window.location.protocol === 'capacitor:') {
    StatusBar.hide().catch(e => console.error("Could not hide status bar", e));
    // Repeat for safety
    setTimeout(() => StatusBar.hide().catch(() => { }), 1000);
  }

  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Element with ID 'root' was not found in the DOM.");
  }

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
          <div style={{ padding: '20px', color: 'red', fontFamily: 'monospace', background: '#fff', height: '100vh' }}>
            <h1>React Runtime Error</h1>
            <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error?.toString()}</pre>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '10px' }}>{this.state.error?.stack}</pre>
          </div>
        );
      }
      return this.props.children;
    }
  }

  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );

  console.log("V3.2 - REACT RENDERED CALLED");
} catch (e: any) {
  showFatalError("Initialization Failure", e?.stack || String(e));
}
