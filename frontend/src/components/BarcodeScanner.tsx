import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onScanFailure?: (error: any) => void;
    isPaused?: boolean;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess, isPaused = false }) => {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [errorMsg, setErrorMsg] = useState<string>('');
    const [isInitializing, setIsInitializing] = useState(true);
    const mountedRef = useRef(false);
    const lastScannedRef = useRef<string>('');

    const startScanner = async () => {
        const elemId = "reader-custom";
        setErrorMsg('');
        setIsInitializing(true);

        try {
            if (!mountedRef.current) return;

            // Clean up old instance if any
            if (scannerRef.current) {
                try {
                    if (scannerRef.current.isScanning) await scannerRef.current.stop();
                    scannerRef.current.clear();
                } catch (e) {
                    console.warn("Error cleaning up old scanner instance", e);
                }
            }

            const html5QrCode = new Html5Qrcode(elemId);
            scannerRef.current = html5QrCode;

            await html5QrCode.start(
                { facingMode: "environment" },
                {
                    fps: 15,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                },
                (decodedText) => {
                    // On ne traite les scans que si PAS en pause
                    if (mountedRef.current && !isPaused && decodedText !== lastScannedRef.current) {
                        lastScannedRef.current = decodedText;
                        onScanSuccess(decodedText);

                        // Cooldown local pour éviter les bleeps multiples
                        setTimeout(() => {
                            if (lastScannedRef.current === decodedText) lastScannedRef.current = '';
                        }, 3000);
                    }
                },
                () => { /* Quiet ignore common scan errors */ }
            );
            setIsInitializing(false);

            // Si on démarre et qu'on doit être en pause
            if (isPaused) {
                scannerRef.current.pause(true);
            }
        } catch (err: any) {
            console.error("Erreur start scanner", err);
            setIsInitializing(false);
            if (mountedRef.current) {
                if (err.toString().includes("is already being used")) {
                    setErrorMsg("Accès caméra bloqué (déjà utilisée). Réessayez dans 1 seconde.");
                    setTimeout(startScanner, 1500);
                } else {
                    setErrorMsg("Erreur d'accès à la caméra. Vérifiez les permissions.");
                }
            }
        }
    };

    // Gestion de la PAUSE / REPRISE
    useEffect(() => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            if (isPaused) {
                console.log("Scanner PAUSED");
                scannerRef.current.pause(true); // pause video processing
            } else {
                console.log("Scanner RESUMED");
                try {
                    scannerRef.current.resume();
                } catch (e) {
                    console.warn("Resume failed, restarting...", e);
                    startScanner();
                }
            }
        }
    }, [isPaused]);

    useEffect(() => {
        mountedRef.current = true;
        const timeoutId = setTimeout(startScanner, 500);

        return () => {
            mountedRef.current = false;
            clearTimeout(timeoutId);

            if (scannerRef.current) {
                const scanner = scannerRef.current;
                scannerRef.current = null;

                if (scanner.isScanning) {
                    scanner.stop().then(() => {
                        scanner.clear();
                    }).catch(() => {
                        try { scanner.clear(); } catch (e) { }
                    });
                } else {
                    try { scanner.clear(); } catch (e) { }
                }
            }
        };
    }, []);

    return (
        <div className="w-full h-full relative overflow-hidden bg-black">
            <div id="reader-custom" className="w-full h-full"></div>

            {/* Overlay de pause visuel si besoin, mais ici on gère via le parent */}

            {isInitializing && !errorMsg && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-30">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
                    <span className="text-white font-black uppercase tracking-widest text-[10px] animate-pulse">Initialisation...</span>
                </div>
            )}

            {errorMsg && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/90 text-white p-6 text-center z-40">
                    <div>
                        <div className="bg-red-600/20 p-4 rounded-2xl border border-red-500/50 mb-4">
                            <p className="font-bold text-xs mb-2">{errorMsg}</p>
                        </div>
                        <button
                            onClick={startScanner}
                            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl active:scale-95 transition-transform"
                        >
                            Réessayer
                        </button>
                    </div>
                </div>
            )}

            {/* Viseur Toujours Visible */}
            <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center p-8">
                <div className="w-full aspect-square max-w-[250px] border-2 border-white/20 rounded-3xl relative">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-xl mt-[-4px] ml-[-4px]"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-xl mt-[-4px] mr-[-4px]"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-xl mb-[-4px] ml-[-4px]"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-xl mb-[-4px] mr-[-4px]"></div>

                    {/* Scan Line Animation (only when not paused) */}
                    {!isPaused && !isInitializing && (
                        <div className="absolute left-4 right-4 h-0.5 bg-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-scan-line top-1/2 opacity-50"></div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BarcodeScanner;
