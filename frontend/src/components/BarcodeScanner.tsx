import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface BarcodeScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onScanFailure?: (error: any) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScanSuccess, onScanFailure }) => {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        // Initialisation du scanner
        scannerRef.current = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
        );

        scannerRef.current.render(
            (decodedText) => {
                onScanSuccess(decodedText);
                // Optionnel: Arrêter le scan après succès si on veut scanner un seul item
                // scannerRef.current?.clear(); 
            },
            (error) => {
                if (onScanFailure) onScanFailure(error);
            }
        );

        // Cleanup
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(error => console.error("Failed to clear html5-qrcode scanner. ", error));
            }
        };
    }, []); // Empty dependency array ensures this runs once

    return (
        <div className="w-full max-w-md mx-auto">
            <div id="reader" style={{ width: '100%' }}></div>
            <p className="text-center text-sm text-gray-500 mt-2">Pointez la caméra vers un code-barres</p>
        </div>
    );
};

export default BarcodeScanner;
