import { StrictMode, Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { StatusBar } from '@capacitor/status-bar';
import './index.css'
import App from './App.tsx'

// Hide StatusBar for true full screen
if (window.location.protocol === 'capacitor:') {
  const hideStatus = () => StatusBar.hide().catch(e => console.error("Could not hide status bar", e));
  hideStatus();
  // Fallback for some devices that show it during splash screen transition
  setTimeout(hideStatus, 1000);
  setTimeout(hideStatus, 3000);
}


// GLOBAL ERROR TRAP

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
