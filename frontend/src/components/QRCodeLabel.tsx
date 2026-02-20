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

    // Create a hidden iframe for printing
    let iframe = document.getElementById('print-iframe') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-iframe';
      iframe.style.position = 'absolute';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    doc.open();
    doc.write(`
        <html>
          <head>
            <title>Etiquette ${materiel.numero_inventaire}</title>
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
                padding: 1mm; 
                display: flex; 
                flex-direction: column; 
                align-items: center;
                justify-content: center;
                break-inside: avoid;
                margin-left: ${s.marginLeft}mm;
                margin-top: ${s.marginTop}mm;
              }
              .qr-code { margin-bottom: 1mm; }
              .qr-code svg { width: ${s.height * 0.7}mm !important; height: ${s.height * 0.7}mm !important; }
              .info { 
                width: 100%;
                font-size: ${s.fontSize}px; 
                font-weight: bold; 
                text-align: center;
                margin-bottom: 1mm;
                border-bottom: 1px solid #eee;
                padding-bottom: 1mm;
              }
              .title { font-size: ${s.fontSize + 2}px; margin-bottom: 1px; display: block; }
              .id { font-size: ${s.fontSize - 2}px; color: gray; margin-top: 1px; display: block; }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="label-container">
              <div class="info">
                <span class="title">${materiel.nom.substring(0, 30)}</span>
                <span class="id">#${materiel.numero_inventaire}</span>
                <div style="font-size: ${s.fontSize - 4}px; opacity: 0.7; margin-top: 2px;">INVENTAIRE PSY</div>
              </div>
              <div class="qr-code">
                ${printContent.querySelector('.qr-code')?.innerHTML || ''}
              </div>
            </div>
          </body>
        </html>
      `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 800);
  };

  return (
    <div>
      {/* Hidden printable area */}
      <div style={{ display: 'none' }}>
        <div ref={printRef} className="label-container">
          <div className="qr-code">
            <QRCodeSVG value={materiel.numero_inventaire} size={120} />
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
