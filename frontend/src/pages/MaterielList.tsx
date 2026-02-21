import React, { useEffect, useState, useRef } from 'react';
import { materielService } from '../services/supabaseApi';
import MaterielForm from '../components/MaterielForm';
import { Printer } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';

const MaterielList: React.FC = () => {
    const [materiels, setMateriels] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const { role } = useAuth();
    const qrContainerRef = useRef<HTMLDivElement>(null);

    const loadData = async () => {
        try {
            const data = await materielService.getAll();
            setMateriels(data as any);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handlePrint = (materiel: any) => {
        // Load dynamic settings or use defaults
        const stored = localStorage.getItem('zebra_printer_settings');
        const s = stored ? JSON.parse(stored) : {
            width: 50,
            height: 25,
            marginLeft: 0,
            marginTop: 0,
            fontSize: 9,
            logoWidth: 15
        };

        // Get QR code SVG from the hidden container (we'll update it temporarily)
        const qrContainer = qrContainerRef.current;
        if (!qrContainer) return;

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
                        <title>Etiquette QR ${materiel.numero_inventaire}</title>
                        <style>
                            @page { 
                                size: ${s.width}mm ${s.height}mm; 
                                margin: 0; 
                            }
                            body { 
                                margin: 0; 
                                padding: 0;
                                width: ${s.width}mm;
                                height: ${s.height}mm;
                                font-family: 'Arial', sans-serif;
                                overflow: hidden;
                            }
                            .label-container {
                                display: flex;
                                flex-direction: column;
                                width: 100%;
                                height: 100%;
                                margin-left: ${s.marginLeft}mm;
                                margin-top: ${s.marginTop}mm;
                                padding: 1mm;
                                box-sizing: border-box;
                            }
                            .header-section {
                                width: 100%;
                                margin-bottom: 1.5mm;
                                text-align: left;
                                border-bottom: 0.1mm solid #eee;
                                padding-bottom: 0.5mm;
                            }
                            .name {
                                font-size: ${s.fontSize}pt;
                                font-weight: bold;
                                text-transform: uppercase;
                                white-space: nowrap;
                                overflow: hidden;
                                text-overflow: ellipsis;
                            }
                            .subtitle {
                                font-size: ${s.fontSize}pt; /* Same as name */
                                color: #444;
                                margin-top: 0.1mm;
                                white-space: nowrap;
                                overflow: hidden;
                                text-overflow: ellipsis;
                            }
                            .bottom-row {
                                flex: 1;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                width: 100%;
                                overflow: hidden;
                            }
                            .col-left {
                                width: 50%;
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
                            .inv-num {
                                font-size: ${s.fontSize - 1}pt;
                                font-weight: bold;
                                font-family: monospace;
                            }
                            .col-right {
                                width: 50%;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                            }
                            .logo-img {
                                max-width: 95%; /* Slightly more width for the larger logo */
                                max-height: ${s.height * 0.58 + 2}mm; /* Match QR height + 2mm */
                                object-fit: contain;
                            }
                        </style>
                    </head>
                    <body>
                      <div class="label-container">
                        <div class="header-section">
                            <div class="name">${materiel.nom}</div>
                            <div class="subtitle">${materiel.marque || 'SANS MARQUE'}</div>
                        </div>
                        <div class="bottom-row">
                            <div class="col-left">
                                <div class="qr-code">
                                    ${qrContainer.innerHTML}
                                </div>
                                <div class="inv-num">${materiel.numero_inventaire}</div>
                            </div>
                            <div class="col-right">
                                <img src="${window.location.origin}/logo.png" class="logo-img" />
                            </div>
                        </div>
                      </div>
                      <script>
                        window.onload = function() {
                           window.print();
                        }
                      </script>
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
        <div>
            {/* Hidden QR Generator */}
            <div style={{ display: 'none' }}>
                {materiels.map((m: any) => (
                    <div key={m.id} id={`qr-${m.numero_inventaire}`} ref={qrContainerRef}>
                        <QRCodeSVG value={m.numero_inventaire} size={128} />
                    </div>
                ))}
            </div>

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Gestion des Matériels</h1>
                {role === 'admin' && (
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700"
                    >
                        {showForm ? 'Fermer' : 'Ajouter un matériel'}
                    </button>
                )}
            </div>

            {showForm && role === 'admin' && (
                <div className="bg-white p-6 rounded shadow mb-6 animate-fade-in">
                    <h2 className="text-xl mb-4">Nouveau Matériel</h2>
                    <MaterielForm onSuccess={() => { setShowForm(false); loadData(); }} />
                </div>
            )}

            <div className="bg-white rounded shadow overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b">
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Inventaire</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Étiquette</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {materiels.map((m: any) => (
                            <tr key={m.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {m.photo_url ? (
                                        <img src={m.photo_url} alt="Matériel" className="h-10 w-10 rounded-full object-cover" />
                                    ) : (
                                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">No</div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{m.numero_inventaire}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{m.categories?.code}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{m.nom}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{m.service}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${m.statut === 'En service' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {m.statut}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <button onClick={() => handlePrint(m)} className="text-blue-600 hover:text-blue-900 flex items-center">
                                        <Printer className="w-4 h-4 mr-1" /> Etiquette QR
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MaterielList;
