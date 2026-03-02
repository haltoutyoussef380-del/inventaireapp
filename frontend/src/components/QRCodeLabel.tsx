import React, { useRef, useState, useEffect } from 'react';
import { Printer } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';

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
      logoWidth: 35,
      qrSize: 20
    };

    // @ts-ignore
    const isMobile = !!window.Capacitor?.isNative || window.location.protocol === 'capacitor:';

    if (isMobile) {
      const doc = new jsPDF({
        orientation: s.width > s.height ? 'l' : 'p',
        unit: 'mm',
        format: [s.width, s.height]
      });

      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, s.width, s.height, 'F');
      doc.setDrawColor(0);
      doc.setLineWidth(0.2);
      doc.line(1.5, 6.5, s.width - 1.5, 6.5);

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(s.fontSize);
      doc.text(materiel.nom.substring(0, 35), 1.5, 4.5);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(Math.max(s.fontSize - 1, 5));
      doc.setTextColor(100);
      doc.text(materiel.marque || 'SANS MARQUE', 1.5, 7.5);

      const qrSize = s.qrSize || 18;
      const canvas = document.querySelector(`#qr-canvas-${materiel.id}`) as HTMLCanvasElement;
      if (canvas) {
        const qrDataUrl = canvas.toDataURL('image/png');
        doc.addImage(qrDataUrl, 'PNG', 1.5, 8.5, qrSize, qrSize);
      }

      doc.setFont('Courier', 'bold');
      doc.setFontSize(Math.max(s.fontSize - 1, 5));
      doc.setTextColor(0);
      doc.text(materiel.numero_inventaire, 1.5 + qrSize / 2, s.height - 1, { align: 'center' });

      if (logoBase64) {
        try {
          const logoWidth = s.logoWidth || 30;
          const logoHeight = s.height * 0.65;
          doc.addImage(logoBase64, 'JPEG', s.width - logoWidth - 2, 9, logoWidth, logoHeight, undefined, 'FAST');
        } catch (e) {
          console.error("Failed to add logo to PDF", e);
        }
      }

      doc.save(`etiquette-${materiel.numero_inventaire}.pdf`);
      return;
    }

    // Desktop - Iframe Print
    let iframe = document.getElementById('print-iframe') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-iframe';
      iframe.style.cssText = 'position:absolute;width:0;height:0;border:none;top:-9999px;left:-9999px';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    const qrSizeMm = s.qrSize || 18;
    const logoW = s.logoWidth || 30;
    const logoH = Math.round(s.height * 0.75);
    const fontPt = s.fontSize || 9;
    const subFontPt = Math.max(fontPt - 1, 5);

    const svgEl = printContent.querySelector('.qr-code svg');
    const svgHTML = svgEl ? svgEl.outerHTML : '';

    const html = [
      '<!DOCTYPE html>',
      '<html><head><title>Etiquette</title><style>',
      '@page{size:' + s.width + 'mm ' + s.height + 'mm;margin:0!important}',
      '*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}',
      'html,body{margin:0!important;padding:0!important;width:' + s.width + 'mm;height:' + s.height + 'mm;font-family:Arial,sans-serif;overflow:hidden;background:white}',
      '.label{width:' + s.width + 'mm;height:' + s.height + 'mm;padding:0.8mm 1.5mm;display:flex;flex-direction:column}',
      '.hdr{border-bottom:0.3mm solid #000;padding-bottom:0.3mm;margin-bottom:0.4mm;line-height:1.1}',
      '.t1{font-size:' + fontPt + 'pt;font-weight:900;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}',
      '.t2{font-size:' + subFontPt + 'pt;color:#555;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}',
      '.row{flex:1;display:flex;align-items:center;overflow:hidden}',
      '.qrside{width:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0.2mm}',
      '.qrside svg{width:' + qrSizeMm + 'mm!important;height:' + qrSizeMm + 'mm!important;display:block}',
      '.inv{font-size:' + subFontPt + 'pt;font-weight:700;font-family:"Courier New",monospace;white-space:nowrap}',
      '.logoside{width:50%;display:flex;align-items:center;justify-content:center}',
      '.logoside img{max-width:' + logoW + 'mm;max-height:' + logoH + 'mm;object-fit:contain}',
      '</style></head><body>',
      '<div class="label">',
      '<div class="hdr"><span class="t1">' + materiel.nom + '</span><span class="t2">' + (materiel.marque || 'SANS MARQUE') + '</span></div>',
      '<div class="row">',
      '<div class="qrside">' + svgHTML + '<span class="inv">' + materiel.numero_inventaire + '</span></div>',
      '<div class="logoside"><img src="' + logoBase64 + '" /></div>',
      '</div></div>',
      '</body></html>'
    ].join('');

    doc.open();
    doc.write(html);
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
            <QRCodeSVG value={materiel.numero_inventaire} size={256} />
            <div style={{ display: 'none' }}>
              <QRCodeCanvas id={`qr-canvas-${materiel.id}`} value={materiel.numero_inventaire} size={256} />
            </div>
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
