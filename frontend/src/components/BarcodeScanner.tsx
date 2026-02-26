import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onScanFailure?: (error: any) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess }) => {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [errorMsg, setErrorMsg] = useState<string>('');
    const mountedRef = useRef(false);
    const lastScannedRef = useRef<string>(''); // Pour éviter de rescanner le même en boucle

    useEffect(() => {
        mountedRef.current = true;
        const elemId = "reader-custom";
        let timeoutId: any;

        const startScanner = async () => {
            try {
                if (!mountedRef.current) return;
                // Si une instance existe déjà, on ne fait rien
                if (scannerRef.current) return;

                const html5QrCode = new Html5Qrcode(elemId);
                scannerRef.current = html5QrCode;

                await html5QrCode.start(
                    { facingMode: "environment" }, // Caméra arrière
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0
                    },
                    (decodedText) => {
                        console.log("Scanner Library Decoded:", decodedText);
                        if (mountedRef.current) {
                            // On empêche le multi-scan instantané du même QR
                            if (decodedText !== lastScannedRef.current) {
                                lastScannedRef.current = decodedText;
                                onScanSuccess(decodedText);

                                // Permettre de rescanner le même code après 3 secondes (si jamais on l'a annulé)
                                setTimeout(() => {
                                    if (lastScannedRef.current === decodedText) {
                                        lastScannedRef.current = '';
                                    }
                                }, 3000);
                            }
                        }
                    },
                    () => {
                        // On ignore les erreurs de scan frame par frame (trop verbeux)
                    }
                );
            } catch (err) {
                console.error("Erreur start scanner", err);
                if (mountedRef.current) setErrorMsg("Impossible d'accéder à la caméra. Vérifiez les permissions.");
            }
        };

        // Petit délai pour s'assurer que le DOM est prêt
        timeoutId = setTimeout(startScanner, 200);

        return () => {
            mountedRef.current = false;
            if (timeoutId) clearTimeout(timeoutId);

            if (scannerRef.current) {
                const scanner = scannerRef.current;
                scannerRef.current = null;

                if (scanner.isScanning) {
                    scanner.stop().then(() => {
                        scanner.clear();
                        console.log("Scanner stopped and cleared");
                    }).catch(err => {
                        console.error("Erreur stop scanner", err);
                        try { scanner.clear(); } catch (e) { }
                    });
                } else {
                    try { scanner.clear(); } catch (e) { }
                }
            }
        };
    }, []); // Run once on mount

    return (
        <div className="w-full max-w-md mx-auto relative rounded-lg overflow-hidden bg-black shadow-2xl">
            <div id="reader-custom" style={{ width: '100%', minHeight: '300px' }}></div>
            {errorMsg && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 text-white p-4 text-center z-20">
                    <div className="bg-red-600/20 p-4 rounded-lg border border-red-500">
                        {errorMsg}
                    </div>
                </div>
            )}
            {!errorMsg && (
                <div className="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-none z-10">
                    <div className="bg-blue-600/80 text-white text-[10px] px-2 py-1 rounded-full animate-pulse uppercase font-bold tracking-wider">
                        Caméra active
                    </div>
                </div>
            )}
        </div>
    );
};

export default BarcodeScanner;
