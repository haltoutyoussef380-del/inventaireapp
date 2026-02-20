import React, { useEffect, useState } from 'react';
import { materielService } from '../services/supabaseApi';
import MaterielForm from '../components/MaterielForm';
import { Printer } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MaterielList: React.FC = () => {
    const [materiels, setMateriels] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const { role } = useAuth();

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
            width: 114,
            height: 25,
            marginLeft: 0,
            marginTop: 0,
            fontSize: 10,
            logoWidth: 28
        };

        const url = materielService.getBarcodeUrl(materiel.numero_inventaire);
        const win = window.open('', '_blank', `width=${s.width * 4},height=${s.height * 4}`);
        if (win) {
            win.document.write(`
                <html>
                    <head>
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
                                display: flex;
                                align-items: center;
                                justify-content: flex-start;
                                font-family: 'Arial', sans-serif;
                                overflow: hidden;
                            }
                            .label-container {
                                display: flex;
                                align-items: center;
                                width: 100%;
                                height: 100%;
                                margin-left: ${s.marginLeft}mm;
                                margin-top: ${s.marginTop}mm;
                            }
                            .logo-section {
                                width: ${s.logoWidth}mm;
                                height: ${s.height}mm;
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: center;
                                border-right: 1px solid #ddd;
                                padding: 0 1mm;
                            }
                            .logo-img {
                                width: ${s.logoWidth - 2}mm;
                                object-fit: contain;
                                margin-bottom: 0.5mm;
                            }
                            .hosp-text {
                                font-size: 5pt;
                                text-align: center;
                                font-weight: bold;
                                text-transform: uppercase;
                                line-height: 1;
                            }
                            .barcode-section {
                                flex: 1;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                padding: 0 1mm;
                            }
                            .barcode-img {
                                height: ${s.height * 0.7}mm;
                                width: auto;
                            }
                            .info-section {
                                width: 35mm;
                                padding-left: 1mm;
                                border-left: 1px solid #ddd;
                                display: flex;
                                flex-direction: column;
                                justify-content: center;
                            }
                            .name {
                                font-size: ${s.fontSize}pt;
                                font-weight: bold;
                                text-transform: uppercase;
                                white-space: nowrap;
                                overflow: hidden;
                                text-overflow: ellipsis;
                            }
                            .inv-num {
                                font-size: ${s.fontSize - 1}pt;
                                margin-top: 0.5mm;
                                font-family: monospace;
                            }
                            .footer-text {
                                font-size: ${s.fontSize - 3}pt;
                                font-weight: bold;
                                margin-top: 0.5mm;
                                opacity: 0.7;
                            }
                        </style>
                    </head>
                    <body>
                      <div class="label-container">
                        <div class="logo-section">
                            <img src="${window.location.origin}/logo.png" class="logo-img" />
                        </div>
                        <div class="barcode-section">
                            <img src="${url}" class="barcode-img" onload="window.print(); setTimeout(() => window.close(), 500);" />
                        </div>
                        <div class="info-section">
                            <div class="name">${materiel.nom}</div>
                            <div class="inv-num">${materiel.numero_inventaire}</div>
                            <div class="footer-text">INVENTAIRE PSY</div>
                        </div>
                      </div>
                    </body>
                </html>
            `);
            win.document.close();
        }
    };

    return (
        <div>
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
                                        <Printer className="w-4 h-4 mr-1" /> Barcode
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
