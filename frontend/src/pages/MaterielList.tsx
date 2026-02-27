import React, { useEffect, useState } from 'react';
import { materielService } from '../services/supabaseApi';
import MaterielForm from '../components/MaterielForm';
import { Printer, Edit2, Trash2, PlusCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';

const MaterielList: React.FC = () => {
    const [materiels, setMateriels] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingMateriel, setEditingMateriel] = useState<any>(null);
    const [logoBase64, setLogoBase64] = useState<string>('');
    const { role } = useAuth();

    const loadData = async () => {
        try {
            const data = await materielService.getAll();
            setMateriels(data as any);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchLogo = async () => {
        try {
            const path = window.location.pathname.endsWith('/') ? window.location.pathname : window.location.pathname + '/';
            const response = await fetch(`${path}logo.png`);
            if (!response.ok) throw new Error("Logo not found");
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onloadend = () => setLogoBase64(reader.result as string);
            reader.readAsDataURL(blob);
        } catch (e) {
            console.error("Logo fetch error", e);
            setLogoBase64(`${window.location.origin}/logo.png`);
        }
    };

    useEffect(() => {
        loadData();
        fetchLogo();
    }, []);

    const handleDelete = async (id: number, name: string) => {
        if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${name}" ? (Cette action est irréversible)`)) {
            try {
                await materielService.delete(id);
                loadData();
            } catch (error) {
                alert('Erreur lors de la suppression');
                console.error(error);
            }
        }
    };

    const startEdit = (materiel: any) => {
        setEditingMateriel(materiel);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePrint = (materiel: any) => {
        const qrContent = document.getElementById(`qr-code-hidden-${materiel.id}`)?.innerHTML;
        if (!qrContent) {
            alert("Erreur de génération du QR Code");
            return;
        }

        const stored = localStorage.getItem('zebra_printer_settings');
        const s = stored ? JSON.parse(stored) : { width: 50, height: 25, marginLeft: 0, marginTop: 0, fontSize: 9, logoWidth: 15 };

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
                        <title>Etiquette</title>
                        <style>
                            @page { size: ${s.width}mm ${s.height}mm; margin: 0 !important; }
                            * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                            html, body { margin: 0 !important; padding: 0 !important; width: ${s.width}mm; height: ${s.height}mm; font-family: 'Arial', sans-serif; overflow: hidden; background-color: white; }
                            .label-container { display: flex; flex-direction: column; width: ${s.width}mm; height: ${s.height}mm; padding: 1mm 2mm; box-sizing: border-box; justify-content: space-between; }
                            .header-section { width: 100%; border-bottom: 0.2mm solid #000; padding-bottom: 0.3mm; }
                            .name { font-size: ${s.fontSize}pt; font-weight: bold; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                            .subtitle { font-size: ${s.fontSize}pt; color: #444; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                            .bottom-row { flex: 1; display: flex; align-items: center; justify-content: center; width: 100%; overflow: hidden; }
                            .col-left { width: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; }
                            .qr-code svg { width: ${s.qrSize || (s.height * 0.72)}mm !important; height: ${s.qrSize || (s.height * 0.72)}mm !important; }
                            .inv-num { font-size: ${s.fontSize}pt; font-weight: bold; font-family: 'Courier New', monospace; }
                            .col-right { width: 50%; display: flex; justify-content: center; align-items: center; }
                            .logo-img { max-width: 98%; max-height: ${s.height * 0.78}mm; object-fit: contain; }
                        </style>
                    </head>
                    <body>
                      <div class="label-container">
                        <div class="header-section">
                            <div class="name">${materiel.nom}</div>
                            <div class="subtitle">${materiel.marque || 'SANS MARQUE'}${materiel.adresse_ip ? ' IP: ' + materiel.adresse_ip : ''}</div>
                        </div>
                        <div class="bottom-row">
                            <div class="col-left">
                                <div class="qr-code">${qrContent}</div>
                                <div class="inv-num">${materiel.numero_inventaire}</div>
                            </div>
                            <div class="col-right">
                                <img src="${logoBase64}" class="logo-img" />
                            </div>
                        </div>
                      </div>
                      <script>window.onload = function() { window.print(); }</script>
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
        <div className="p-4 md:p-6 animate-fade-in">
            <div style={{ display: 'none' }}>
                {materiels.map((m: any) => (
                    <div key={m.id} id={`qr-code-hidden-${m.id}`}>
                        <QRCodeSVG value={m.numero_inventaire} size={128} />
                    </div>
                ))}
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <h1 className="text-3xl font-black text-gray-800 tracking-tight">Gestion du Parc</h1>
                {role === 'admin' && (
                    <button
                        onClick={() => {
                            setEditingMateriel(null);
                            setShowForm(!showForm);
                        }}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${showForm && !editingMateriel ? 'bg-gray-100 text-gray-600' : 'bg-gst-dark text-white hover:bg-gst-light shadow-gst-dark/20 hover:-translate-y-0.5'}`}
                    >
                        {showForm && !editingMateriel ? 'Fermer' : <><PlusCircle className="w-5 h-5" /> Ajouter un matériel</>}
                    </button>
                )}
            </div>

            {showForm && role === 'admin' && (
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 mb-8 animate-in slide-in-from-top duration-300">
                    <h2 className="text-xl font-bold mb-6 text-gray-800 border-l-4 border-gst-light pl-4">
                        {editingMateriel ? `Modifier : ${editingMateriel.nom}` : 'Nouveau Matériel'}
                    </h2>
                    <MaterielForm
                        initialData={editingMateriel}
                        onSuccess={() => {
                            setShowForm(false);
                            setEditingMateriel(null);
                            loadData();
                        }}
                    />
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Article</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">ID Inventaire</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Catégorie</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Service</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Statut</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {materiels.map((m: any) => (
                                <tr key={m.id} className="hover:bg-gray-50/80 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100 shadow-sm">
                                                {m.photo_url ? (
                                                    <img src={m.photo_url.startsWith('http') ? m.photo_url : `https://hckfizhzvslhyxsaftnx.supabase.co/storage/v1/object/public/materiel-photos/${m.photo_url}`}
                                                        alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center text-gray-300 font-bold text-xs">NO IMG</div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 group-hover:text-gst-light transition-colors">{m.nom}</div>
                                                <div className="text-xs text-gray-400">{m.marque || 'Sans marque'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm font-bold text-gray-600">{m.numero_inventaire}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="bg-gray-100 px-2 py-1 rounded text-xs font-bold text-gray-600">
                                            {m.categories?.code || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{m.service || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full shadow-sm ${m.statut === 'En service' ? 'bg-green-50 text-green-700' :
                                            m.statut === 'En maintenance' ? 'bg-orange-50 text-orange-700' :
                                                'bg-red-50 text-red-700'
                                            }`}>
                                            {m.statut}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <div className="flex justify-center gap-1">
                                            <button
                                                onClick={() => handlePrint(m)}
                                                className="p-2 text-gst-light hover:bg-gst-light/10 rounded-lg transition-colors border border-transparent hover:border-gst-light/20"
                                                title="Imprimer Étiquette"
                                            >
                                                <Printer className="w-4 h-4" />
                                            </button>
                                            {role === 'admin' && (
                                                <>
                                                    <button
                                                        onClick={() => startEdit(m)}
                                                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-transparent hover:border-amber-100"
                                                        title="Modifier"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(m.id, m.nom)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MaterielList;
