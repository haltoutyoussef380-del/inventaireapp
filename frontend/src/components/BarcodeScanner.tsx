import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onScanFailure?: (error: any) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess }) => {
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
                    if (mountedRef.current && decodedText !== lastScannedRef.current) {
                        lastScannedRef.current = decodedText;
                        onScanSuccess(decodedText);

                        // Cooldown local to prevent double bleeps
                        setTimeout(() => {
                            if (lastScannedRef.current === decodedText) lastScannedRef.current = '';
                        }, 3000);
                    }
                },
                () => { /* Quiet ignore common scan errors */ }
            );
            setIsInitializing(false);
        } catch (err: any) {
            console.error("Erreur start scanner", err);
            setIsInitializing(false);
            if (mountedRef.current) {
                if (err.toString().includes("is already being used")) {
                    setErrorMsg("Accès caméra bloqué (déjà utilisée). Réessayez dans 1 seconde.");
                    // Auto-retry once
                    setTimeout(startScanner, 1500);
                } else {
                    setErrorMsg("Erreur d'accès à la caméra. Vérifiez les permissions.");
                }
            }
        }
    };

    useEffect(() => {
        mountedRef.current = true;
        // Delay to allow DOM stability and camera release from previous mount
        const timeoutId = setTimeout(startScanner, 500);

        return () => {
            mountedRef.current = false;
            clearTimeout(timeoutId);

            if (scannerRef.current) {
                const scanner = scannerRef.current;
                scannerRef.current = null;

                // Fire and forget stop
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
        <div className="w-full max-w-md mx-auto relative rounded-[28px] overflow-hidden bg-black shadow-2xl border-4 border-white/10 aspect-square">
            <div id="reader-custom" className="w-full h-full"></div>

            {isInitializing && !errorMsg && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-30">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
                    <span className="text-white font-black uppercase tracking-widest text-xs animate-pulse">Initialisation Caméra...</span>
                </div>
            )}

            {errorMsg && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/90 text-white p-6 text-center z-40">
                    <div>
                        <div className="bg-red-600/20 p-4 rounded-2xl border border-red-500/50 mb-4">
                            <p className="font-bold text-sm mb-2">{errorMsg}</p>
                        </div>
                        <button
                            onClick={startScanner}
                            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-transform"
                        >
                            Réessayer
                        </button>
                    </div>
                </div>
            )}

            <div className="absolute inset-0 pointer-events-none border-[40px] border-black/20 z-10">
                <div className="w-full h-full border-2 border-blue-500/30 rounded-2xl relative">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
                </div>
            </div>
        </div>
    );
};

export default BarcodeScanner;
