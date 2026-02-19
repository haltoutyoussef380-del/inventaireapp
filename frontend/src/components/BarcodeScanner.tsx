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

    useEffect(() => {
        mountedRef.current = true;
        const elemId = "reader-custom";

        const startScanner = async () => {
            try {
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
                        if (mountedRef.current) {
                            onScanSuccess(decodedText);
                        }
                    },
                    () => {
                        // On ignore les erreurs de scan frame par frame (trop verbeux)
                        // console.log(errorMessage);
                    }
                );
            } catch (err) {
                console.error("Erreur start scanner", err);
                if (mountedRef.current) setErrorMsg("Impossible d'accéder à la caméra. Vérifiez les permissions.");
            }
        };

        // Petit délai pour s'assurer que le DOM est prêt
        setTimeout(startScanner, 100);

        return () => {
            mountedRef.current = false;
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().then(() => {
                    scannerRef.current?.clear();
                    scannerRef.current = null;
                }).catch(err => {
                    console.error("Erreur stop scanner", err);
                });
            }
        };
    }, []); // Run once on mount

    return (
        <div className="w-full max-w-md mx-auto relative rounded-lg overflow-hidden bg-black">
            <div id="reader-custom" style={{ width: '100%', minHeight: '300px' }}></div>
            {errorMsg && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 text-white p-4 text-center">
                    {errorMsg}
                </div>
            )}
            {!errorMsg && <div className="absolute bottom-4 left-0 right-0 text-center text-white text-sm opacity-70">
                Caméra active
            </div>}
        </div>
    );
};

export default BarcodeScanner;
