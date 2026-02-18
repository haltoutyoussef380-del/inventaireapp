import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer } from 'lucide-react';

interface QRCodeLabelProps {
    materiel: {
        id: number;
        nom: string;
        numero_inventaire: string;
        service_perimetre?: string;
        categorie?: string;
    };
}

const QRCodeLabel: React.FC<QRCodeLabelProps> = ({ materiel }) => {
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        const windowUrl = 'about:blank';
        const uniqueName = new Date().getTime();
        const windowName = 'Print' + uniqueName;
        const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=0,height=0');

        if (printWindow) {
            printWindow.document.write(`
        <html>
          <head>
            <style>
              body { font-family: sans-serif; margin: 0; padding: 10px; }
              .label-container { 
                border: 2px solid black; 
                width: 300px; 
                padding: 10px; 
                display: flex; 
                flex-direction: row; 
                align-items: center;
                break-inside: avoid;
              }
              .qr-code { margin-right: 15px; }
              .info { font-size: 12px; font-weight: bold; }
              .title { font-size: 14px; margin-bottom: 5px; display: block; }
              .id { font-size: 10px; color: gray; margin-top: 5px; display: block; }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
            <script>
              setTimeout(() => {
                window.print();
                window.close();
              }, 250);
            </script>
          </body>
        </html>
      `);
            printWindow.document.close();
            printWindow.focus();
        }
    };

    return (
        <div>
            {/* Hidden printable area */}
            <div style={{ display: 'none' }}>
                <div ref={printRef} className="label-container">
                    <div className="qr-code">
                        <QRCodeSVG value={materiel.numero_inventaire} size={80} />
                    </div>
                    <div className="info">
                        <span className="title">{materiel.nom.substring(0, 20)}</span>
                        {materiel.service_perimetre && <div>Loc: {materiel.service_perimetre}</div>}
                        {materiel.categorie && <div>Cat: {materiel.categorie}</div>}
                        <span className="id">#{materiel.numero_inventaire}</span>
                    </div>
                </div>
            </div>

            {/* Print Trigger Button */}
            <button
                onClick={handlePrint}
                className="text-blue-600 hover:text-blue-800 p-1"
                title="Imprimer l'étiquette QR"
            >
                <Printer size={18} />
            </button>
        </div>
    );
};

export default QRCodeLabel;
