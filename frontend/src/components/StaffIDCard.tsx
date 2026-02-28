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
    };
}

const StaffIDCard: React.FC<StaffIDCardProps> = ({ agent }) => {
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
            // Background Gradient Simulate
            doc.setFillColor(245, 247, 250);
            doc.rect(0, 0, cardWidth, cardHeight, 'F');

            // Top Bar
            doc.setFillColor(15, 23, 42); // gst-dark
            doc.rect(0, 0, cardWidth, 8, 'F');

            // Logo Small
            if (logoBase64) {
                doc.addImage(logoBase64, 'PNG', 4, 1.5, 12, 5);
            }

            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(255);
            doc.text("CARTE PROFESSIONNELLE", cardWidth / 2, 5, { align: 'center' });

            // Staff Photo
            if (agent.photo_url) {
                try {
                    doc.addImage(agent.photo_url, 'JPEG', 6, 12, 28, 35);
                } catch (e) {
                    doc.setFillColor(200);
                    doc.rect(6, 12, 28, 35, 'F');
                }
            } else {
                doc.setFillColor(220, 225, 235);
                doc.rect(6, 12, 28, 35, 'F');
                doc.setTextColor(150);
                doc.setFontSize(6);
                doc.text("PHOTO", 20, 30, { align: 'center' });
            }

            // Details
            doc.setTextColor(15, 23, 42);
            doc.setFontSize(10);
            doc.text(agent.full_name?.toUpperCase() || agent.email.split('@')[0].toUpperCase(), 40, 22);

            doc.setFontSize(7);
            doc.setTextColor(100);
            doc.text("FONCTION", 40, 28);
            doc.setFontSize(8);
            doc.setTextColor(0);
            doc.text(agent.fonction?.toUpperCase() || "AGENT GST", 40, 32);

            doc.setFontSize(7);
            doc.setTextColor(100);
            doc.text("MATRICULE", 40, 38);
            doc.setFontSize(9);
            doc.setTextColor(15, 23, 42);
            doc.text(agent.matricule || "NON ASSIGNÉ", 40, 42);

            // --- VERSO (BACK) ---
            doc.addPage([cardWidth, cardHeight], 'l');

            // Header Banner
            if (headerBase64) {
                doc.addImage(headerBase64, 'PNG', 0, 0, cardWidth, 12);
            } else {
                doc.setFillColor(15, 23, 42);
                doc.rect(0, 0, cardWidth, 12, 'F');
            }

            doc.setFontSize(6);
            doc.setTextColor(50);
            const instructions = [
                "Cette carte est strictement personnelle et incessible.",
                "En cas de perte, merci de prévenir immédiatement l'administration.",
                "Ce badge doit être porté de manière visible dans l'établissement."
            ];
            instructions.forEach((line, i) => {
                doc.text(line, cardWidth / 2, 25 + (i * 4), { align: 'center' });
            });

            // Small watermark logo
            if (logoBase64) {
                doc.setGState(new (doc as any).GState({ opacity: 0.1 }));
                doc.addImage(logoBase64, 'PNG', cardWidth - 25, cardHeight - 20, 20, 15);
                doc.setGState(new (doc as any).GState({ opacity: 1.0 }));
            }

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

        const doc = iframe.contentWindow?.document || iframe.contentDocument;
        if (!doc) return;

        doc.write(`
      <html>
        <head>
          <style>
            @page { size: 86mm 54mm; margin: 0; }
            body { margin: 0; padding: 0; font-family: 'Segoe UI', system-ui, sans-serif; background: #fff; }
            .card {
              width: 85.6mm;
              height: 54mm;
              position: relative;
              overflow: hidden;
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
              border: 0.1mm solid #e2e8f0;
              box-sizing: border-box;
              page-break-after: always;
            }
            .card-back {
                background: white;
            }
            .top-banner {
              height: 8mm;
              background: #0f172a;
              color: white;
              display: flex;
              align-items: center;
              padding: 0 4mm;
              box-sizing: border-box;
            }
            .logo-header { height: 5mm; }
            .badge-title { margin-left: auto; font-size: 7pt; font-weight: 900; letter-spacing: 0.5mm; }
            
            .photo-box {
              position: absolute;
              left: 6mm;
              top: 12mm;
              width: 28mm;
              height: 35mm;
              background: #cbd5e1;
              border-radius: 2mm;
              overflow: hidden;
              box-shadow: 0 1mm 2mm rgba(0,0,0,0.1);
            }
            .photo-box img { width: 100%; height: 100%; object-fit: cover; }
            
            .info-box {
              position: absolute;
              left: 40mm;
              top: 15mm;
              right: 4mm;
            }
            .name { font-size: 11pt; font-weight: 900; color: #0f172a; margin-bottom: 3mm; line-height: 1.2; }
            .label { font-size: 6pt; font-weight: 900; color: #64748b; margin-top: 2mm; text-transform: uppercase; }
            .value { font-size: 8pt; font-weight: 700; color: #1e293b; }
            .matricule { font-size: 10pt; font-family: monospace; }
            
            .back-header { width: 100%; height: 12mm; object-fit: cover; }
            .instructions {
                margin: 6mm 4mm;
                font-size: 6.5pt;
                color: #475569;
                text-align: center;
                line-height: 1.6;
            }
            .footer-logo {
                position: absolute;
                bottom: 4mm;
                right: 4mm;
                opacity: 0.2;
                height: 10mm;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="top-banner">
              <img src="${logoBase64}" class="logo-header" />
              <span class="badge-title">CARTE PROFESSIONNELLE</span>
            </div>
            <div class="photo-box">
              ${agent.photo_url ? `<img src="${agent.photo_url}" />` : ''}
            </div>
            <div class="info-box">
              <div class="name">${agent.full_name || agent.email.split('@')[0]}</div>
              <div class="label">Fonction</div>
              <div class="value">${agent.fonction || 'Personnel Hospitalier'}</div>
              <div class="label">Matricule</div>
              <div class="value matricule">${agent.matricule || '########'}</div>
            </div>
          </div>
          <div class="card card-back">
            <img src="${headerBase64}" class="back-header" />
            <div class="instructions">
                Cette carte est strictement personnelle et incessible.<br/>
                En cas de perte, merci de prévenir l'administration de l'Hôpital.<br/>
                Ce badge doit être porté de manière visible dans l'enceinte de l'établissement.<br/>
                Système GST-INVENTAIRE.
            </div>
            <img src="${logoBase64}" class="footer-logo" />
          </div>
        </body>
      </html>
    `);
        doc.close();

        setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
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
