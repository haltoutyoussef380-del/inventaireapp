import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { Printer } from 'lucide-react';

interface StaffIDCardProps {
  agent: {
    id: string;
    email: string;
    full_name?: string;
    matricule?: string;
    fonction?: string;
    photo_url?: string;
    cnie?: string;
  };
  customInstructions?: string;
}

const StaffIDCard: React.FC<StaffIDCardProps> = ({ agent, customInstructions }) => {
  const [logoBase64, setLogoBase64] = useState<string>('');
  const [headerBase64, setHeaderBase64] = useState<string>('');

  const fetchAssets = async () => {
    try {
      const baseUrl = window.location.origin + window.location.pathname.replace(/\/$/, '') + '/';

      const logoResp = await fetch(`${baseUrl}logo.png`);
      if (logoResp.ok) {
        const blob = await logoResp.blob();
        const reader = new FileReader();
        reader.onloadend = () => setLogoBase64(reader.result as string);
        reader.readAsDataURL(blob);
      }

      const headerResp = await fetch(`${baseUrl}header.png`);
      if (headerResp.ok) {
        const blob = await headerResp.blob();
        const reader = new FileReader();
        reader.onloadend = () => setHeaderBase64(reader.result as string);
        reader.readAsDataURL(blob);
      }
    } catch (e) {
      console.error("Asset fetch error", e);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handlePrint = () => {
    // @ts-ignore
    const isMobile = !!window.Capacitor?.isNative || window.location.protocol === 'capacitor:';
    const cardWidth = 85.6; // ISO/IEC 7810 ID-1 standard width in mm
    const cardHeight = 54;

    if (isMobile) {
      const doc = new jsPDF({
        orientation: 'l',
        unit: 'mm',
        format: [cardWidth, cardHeight]
      }) as any;

      // --- RECTO (FRONT) ---
      // Background White
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, cardWidth, cardHeight, 'F');

      // Header Banner (Top Recto)
      if (headerBase64) {
        doc.addImage(headerBase64, 'PNG', 0, 0, cardWidth, 16);
      }

      // Watermark Logo
      if (logoBase64) {
        doc.setGState(new (doc as any).GState({ opacity: 0.25 }));
        doc.addImage(logoBase64, 'PNG', (cardWidth - 40) / 2, (cardHeight - 30) / 2 + 5, 40, 30);
        doc.setGState(new (doc as any).GState({ opacity: 1.0 }));
      }

      // Staff Photo
      if (agent.photo_url) {
        try {
          doc.addImage(agent.photo_url, 'JPEG', 6, 18, 28, 33);
        } catch (e) {
          doc.setFillColor(240);
          doc.rect(6, 18, 28, 33, 'F');
        }
      } else {
        doc.setFillColor(240, 242, 245);
        doc.rect(6, 18, 28, 33, 'F');
        doc.setTextColor(180);
        doc.setFontSize(6);
        doc.text("PHOTO", 20, 35, { align: 'center' });
      }

      // Details
      doc.setTextColor(15, 23, 42); // gst-dark
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(agent.full_name?.toUpperCase() || agent.email.split('@')[0].toUpperCase(), 40, 24);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100);
      doc.text("FONCTION", 40, 30);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(0);
      doc.text(agent.fonction?.toUpperCase() || "PERSONNEL HOSPITALIER", 40, 34);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100);
      doc.text("MATRICULE", 40, 40);
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(agent.matricule || "########", 40, 44);

      // CNIE
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100);
      doc.text("CNIE", 40, 49);
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(agent.cnie || "N/A", 40, 53);

      // --- VERSO (BACK) ---
      doc.addPage([cardWidth, cardHeight], 'l');

      // Watermark Logo (Back)
      if (logoBase64) {
        doc.setGState(new (doc as any).GState({ opacity: 0.25 }));
        doc.addImage(logoBase64, 'PNG', (cardWidth - 50) / 2, (cardHeight - 40) / 2, 50, 40);
        doc.setGState(new (doc as any).GState({ opacity: 1.0 }));
      }

      doc.setFontSize(7);
      doc.setTextColor(50);
      doc.setFont('Helvetica', 'bold');
      doc.text("INSTRUCTIONS", cardWidth / 2, 15, { align: 'center' });

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(6.5);
      const instructions = [
        "Cette carte est strictement personnelle et incessible.",
        "En cas de perte, merci de prévenir immédiatement l'administration.",
        "Ce badge doit être porté de manière visible dans l'établissement.",
        "Système de Gestion GST-INVENTAIRE."
      ];
      instructions.forEach((line, i) => {
        doc.text(line, cardWidth / 2, 25 + (i * 5), { align: 'center' });
      });

      doc.save(`badge-${agent.email.split('@')[0]}.pdf`);
      return;
    }

    // WEB PRINT IFRAME
    let iframe = document.getElementById('print-iframe-badge') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-iframe-badge';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0px';
      iframe.style.height = '0px';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
    }

    const win = iframe.contentWindow;
    if (!win) return;
    const doc = win.document;

    doc.write(`
      <html>
        <head>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            @page { size: 85.6mm 53.98mm; margin: 0; }
            body { margin: 0; padding: 0; font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; background: #fff; }
            .card {
              width: 85.6mm;
              height: 53.98mm;
              position: relative;
              overflow: hidden;
              background: white;
              border: 0.1mm solid #eee;
              box-sizing: border-box;
              page-break-after: always;
            }
            .watermark {
              position: absolute;
              left: 50%;
              top: 55%;
              transform: translate(-50%, -50%);
              width: 45mm;
              opacity: 0.25;
              z-index: 0;
            }
            .recto-header {
              width: 100%;
              height: 16mm;
              object-fit: contain;
              padding: 1mm 2mm;
              box-sizing: border-box;
              border-bottom: 0.2mm solid #f1f5f9;
            }
            .photo-box {
              position: absolute;
              left: 6mm;
              top: 18mm;
              width: 28mm;
              height: 33mm;
              background: #f8fafc;
              border-radius: 1.5mm;
              overflow: hidden;
              box-shadow: 0 1mm 3mm rgba(0,0,0,0.05);
              z-index: 10;
              border: 0.2mm solid #e2e8f0;
            }
            .photo-box img { width: 100%; height: 100%; object-fit: cover; }
            
            .info-box {
              position: absolute;
              left: 38mm;
              top: 18mm;
              right: 4mm;
              z-index: 10;
            }
            .name { font-size: 10.5pt; font-weight: 900; color: #0f172a; margin-bottom: 2mm; line-height: 1.1; text-transform: uppercase; }
            .field { margin-top: 1.5mm; }
            .label { font-size: 6pt; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.2mm; }
            .value { font-size: 8pt; font-weight: 800; color: #334155; text-transform: uppercase; }
            .cnie-box { margin-top: 1.5mm; }

            .card-back { background: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; }
            .back-title { font-size: 9pt; font-weight: 900; color: #0f172a; margin-bottom: 4mm; }
            .instructions {
                font-size: 6.5pt;
                color: #475569;
                text-align: center;
                line-height: 1.8;
                padding: 0 8mm;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <img src="${headerBase64}" class="recto-header" />
            <img src="${logoBase64}" class="watermark" />
            <div class="photo-box">
              ${agent.photo_url ? `<img src="${agent.photo_url}" />` : ''}
            </div>
            <div class="info-box">
              <div class="name">${agent.full_name || agent.email.split('@')[0]}</div>
              <div class="field">
                <div class="label">Fonction</div>
                <div class="value">${agent.fonction || 'Personnel Hospitalier'}</div>
              </div>
              <div class="field">
                <div class="label">Matricule</div>
                <div class="value">${agent.matricule || '########'}</div>
              </div>
              <div class="field cnie-box">
                <div class="label">CNIE</div>
                <div class="value">${agent.cnie || 'N/A'}</div>
              </div>
            </div>
          </div>

          <div class="card card-back">
            <img src="${logoBase64}" class="watermark" style="width: 55mm; opacity: 0.25;" />
            <div class="back-title">INSTRUCTIONS</div>
            <div class="instructions">
                ${customInstructions ? customInstructions.replace(/\n/g, '<br/>') : `
                Cette carte est strictement personnelle et incessible.<br/>
                En cas de perte, merci de prévenir l'administration.<br/>
                Ce badge doit être porté de manière visible.<br/>
                Espace sécurisé - Hôpital Mohammed VI.
                `}
            </div>
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      win.focus();
      win.print();
    }, 500);
  };

  return (
    <button
      onClick={handlePrint}
      className="inline-flex items-center gap-2 px-4 py-2 bg-gst-dark text-white rounded-xl font-bold hover:bg-gst-light transition-all shadow-md text-xs uppercase"
    >
      <Printer size={16} /> Imprimer Carte
    </button>
  );
};

export default StaffIDCard;
