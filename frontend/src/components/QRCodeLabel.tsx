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

    const stored = localStorage.getItem('zebra_printer_settings');
    const s = stored ? JSON.parse(stored) : {
      width: 114,
      height: 25,
      marginLeft: 0,
      marginTop: 0,
      fontSize: 10,
      logoWidth: 28
    };

    const windowUrl = 'about:blank';
    const uniqueName = new Date().getTime();
    const windowName = 'Print' + uniqueName;
    const printWindow = window.open(windowUrl, windowName, `width=${s.width * 4},height=${s.height * 4}`);

    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <style>
              @page { 
                size: ${s.width}mm ${s.height}mm; 
                margin: 0; 
              }
              body { 
                font-family: sans-serif; 
                margin: 0; 
                padding: 0;
                width: ${s.width}mm;
                height: ${s.height}mm;
                overflow: hidden;
              }
              .label-container { 
                width: 100%;
                height: 100%;
                padding: 2mm; 
                display: flex; 
                flex-direction: row; 
                align-items: center;
                break-inside: avoid;
                margin-left: ${s.marginLeft}mm;
                margin-top: ${s.marginTop}mm;
              }
              .qr-code { margin-right: 25px; }
              .info { font-size: ${s.fontSize}px; font-weight: bold; }
              .title { font-size: ${s.fontSize + 2}px; margin-bottom: 2px; display: block; }
              .id { font-size: ${s.fontSize - 2}px; color: gray; margin-top: 2px; display: block; }
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
              }, 500);
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
