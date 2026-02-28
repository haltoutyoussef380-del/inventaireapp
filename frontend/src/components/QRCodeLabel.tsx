import React, { useRef, useState, useEffect } from 'react';
import { Printer } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { QRCodeCanvas } from 'qrcode.react';

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
  const [logoBase64, setLogoBase64] = useState<string>('');

  const fetchLogo = async () => {
    try {
      const path = window.location.pathname.endsWith('/') ? window.location.pathname : window.location.pathname + '/';
      const response = await fetch(`${path}logo-2.jfif`);
      if (!response.ok) throw new Error("Logo not found");
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => setLogoBase64(reader.result as string);
      reader.readAsDataURL(blob);
    } catch (e) {
      console.error("Logo fetch error", e);
      setLogoBase64(`${window.location.origin}/logo-2.jfif`);
    }
  };

  useEffect(() => {
    fetchLogo();
  }, []);

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

    const isMobile = window.location.protocol === 'capacitor:';

    if (isMobile) {
      // Mobile approach: Generate PDF using jsPDF
      const doc = new jsPDF({
        orientation: s.width > s.height ? 'l' : 'p',
        unit: 'mm',
        format: [s.width, s.height]
      });

      // Background
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, s.width, s.height, 'F');

      // Border bottom for header
      doc.setDrawColor(0);
      doc.setLineWidth(0.2);
      doc.line(2, 6, s.width - 2, 6);

      // Title/Name
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(s.fontSize);
      doc.text(materiel.nom.substring(0, 30), 2, 4);

      // Subtitle
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(s.fontSize * 0.8);
      doc.setTextColor(100);
      doc.text(materiel.marque || 'SANS MARQUE', 2, 9);

      // QR Code
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (canvas) {
        const qrDataUrl = canvas.toDataURL('image/png');
        const qrSize = s.height * 0.6;
        doc.addImage(qrDataUrl, 'PNG', 2, 11, qrSize, qrSize);
      }

      // ID text
      doc.setFont('Courier', 'bold');
      doc.setFontSize(s.fontSize);
      doc.setTextColor(0);
      doc.text(materiel.numero_inventaire, 2, s.height - 2);

      // Logo
      if (logoBase64) {
        try {
          const logoWidth = s.logoWidth || 20;
          const logoHeight = s.height * 0.7;
          doc.addImage(logoBase64, 'JPEG', s.width - logoWidth - 2, 8, logoWidth, logoHeight, undefined, 'FAST');
        } catch (e) {
          console.error("Failed to add logo to PDF", e);
        }
      }

      doc.save(`etiquette-${materiel.numero_inventaire}.pdf`);
      return;
    }

    // Classic Desktop Iframe Printing
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
            <title>Etiquette</title>
            <style>
              @page { 
                size: ${s.width}mm ${s.height}mm; 
                margin: 0 !important; 
              }
              * {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              html, body { 
                margin: 0 !important; 
                padding: 0 !important;
                width: ${s.width}mm;
                height: ${s.height}mm;
                font-family: 'Arial', 'Helvetica', sans-serif;
                overflow: hidden;
                background-color: white;
              }
              .label-container { 
                display: flex; 
                flex-direction: column; 
                width: ${s.width}mm;
                height: ${s.height}mm;
                margin: 0 !important;
                padding: 1mm 2mm !important;
                box-sizing: border-box;
                justify-content: space-between; /* Fill height */
              }
              .header {
                width: 100%;
                margin-bottom: 0.5mm;
                border-bottom: 0.2mm solid #000;
                padding-bottom: 0.3mm;
                display: flex;
                flex-direction: column;
              }
              .title {
                font-size: ${s.fontSize}pt;
                font-weight: bold;
                text-transform: uppercase;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }
              .subtitle {
                font-size: ${s.fontSize}pt; 
                color: #444;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }
              .content-row {
                width: 100%;
                display: flex;
                flex: 1;
                align-items: center;
                justify-content: center;
                overflow: hidden;
              }
              .qr-col {
                width: 50%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
              }
              .qr-code svg { 
                width: ${s.height * 0.72}mm !important; 
                height: ${s.height * 0.72}mm !important; 
                margin-bottom: 0.1mm;
              }
              .id { 
                font-size: ${s.fontSize}pt; 
                font-weight: bold; 
                font-family: 'Courier New', monospace; 
                white-space: nowrap;
              }
              
              .logo-col {
                width: 50%;
                display: flex;
                justify-content: center;
                align-items: center;
              }
              .logo-img {
                max-width: 98%; 
                max-height: ${s.height * 0.78}mm;
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
                   <img src="${logoBase64}" class="logo-img" />
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
            <QRCodeCanvas value={materiel.numero_inventaire} size={256} />
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
