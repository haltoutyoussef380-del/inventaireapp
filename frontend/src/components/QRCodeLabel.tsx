import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer } from 'lucide-react';

interface QRCodeLabelProps {
  materiel: {
    id: number;
    nom: string;
    numero_inventaire: string;
    marque?: string;
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

    doc.write(`
        <html>
          <head>
            <title>Etiquette QR ${materiel.numero_inventaire}</title>
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
                align-items: flex-start;
                break-inside: avoid;
                margin-left: ${s.marginLeft}mm;
                margin-top: ${s.marginTop}mm;
                box-sizing: border-box;
              }
              .header {
                width: 100%;
                margin-bottom: 1.5mm;
                border-bottom: 0.1mm solid #eee;
                padding-bottom: 0.5mm;
              }
              .title { font-size: ${s.fontSize}pt; font-weight: bold; margin-bottom: 1px; display: block; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
              .subtitle { font-size: ${s.fontSize - 3}pt; color: #444; display: block; }
              
              .content-row {
                width: 100%;
                display: flex;
                flex: 1;
                align-items: center;
                justify-content: center;
                gap: 1mm;
                overflow: hidden;
              }
              .qr-col {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
              }
              .qr-code svg { 
                width: ${s.height * 0.58}mm !important; 
                height: ${s.height * 0.58}mm !important; 
                margin-bottom: 0.5mm;
              }
              .id { font-size: ${s.fontSize - 1}pt; font-weight: bold; font-family: monospace; }
              
              .logo-col {
                width: ${s.logoWidth}mm;
                display: flex;
                justify-content: center;
                align-items: center;
                height: ${s.height * 0.65}mm;
              }
              .logo-img {
                width: 100%;
                max-height: 100%;
                object-fit: contain;
              }

              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="label-container">
              <div class="header">
                <span class="title">${materiel.nom}</span>
                <span class="subtitle">${materiel.marque || 'SANS MARQUE'}</span>
              </div>
               <div class="content-row">
                <div class="qr-col">
                  <div class="qr-code">
                    ${printContent.querySelector('.qr-code')?.innerHTML || ''}
                  </div>
                  <span class="id">${materiel.numero_inventaire}</span>
                </div>
                <div class="logo-col">
                   <img src="${window.location.origin}/logo.png" class="logo-img" />
                </div>
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
