import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { ArrowLeft, CheckCircle, Download, XCircle, FileText, Database, Users, Calendar } from 'lucide-react';

interface InventoryItem {
    id: number;
    materiel: {
        id: number;
        nom: string;
        numero_inventaire: string;
        photo_url?: string;
        service?: string;
    };
    scanne_par: string;
    created_at: string;
    agent_name?: string;
}

interface MissingItem {
    id: number;
    nom: string;
    numero_inventaire: string;
    service?: string;
    photo_url?: string;
}

const InventaireDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [scannedItems, setScannedItems] = useState<InventoryItem[]>([]);
    const [missingItems, setMissingItems] = useState<MissingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'scanned' | 'missing'>('scanned');
    const [inventaireInfo, setInventaireInfo] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const { data: inv } = await supabase.from('inventaires').select('*').eq('id', id).single();
            setInventaireInfo(inv);

            const { data: scans, error: scanError } = await supabase
                .from('inventaire_lignes')
                .select(`
                    *,
                    materiel:materiels(*),
                    agent:scanne_par(*) 
                `)
                .eq('inventaire_id', id);

            if (scanError) throw scanError;

            const formattedScans = scans.map((line: any) => ({
                ...line,
                agent_name: line.agent?.full_name || line.agent?.email || 'Inconnu',
                created_at: line.date_scan || line.created_at
            }));
            setScannedItems(formattedScans);

            const scannedIds = scans.map((s: any) => s.materiel_id);
            const { data: allMateriels } = await supabase.from('materiels').select('*').neq('statut', 'Rebut');

            if (allMateriels) {
                const missing = allMateriels.filter(m => !scannedIds.includes(m.id));
                setMissingItems(missing);
            }
        } catch (error) {
            console.error("Error loading details:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePDF = async (type: 'scanned' | 'missing') => {
        const { jsPDF } = await import('jspdf');
        await import('jspdf-autotable');

        const loadImageBase64 = async (url: string) => {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                return new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            } catch (e) {
                return null;
            }
        };

        const baseUrl = import.meta.env.BASE_URL || '/';
        const headerBase64 = await loadImageBase64(`${baseUrl}header.png`);
        const footerBase64 = await loadImageBase64(`${baseUrl}footer.png`);

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        const reportTitle = type === 'scanned' ? "RAPPORT MATÉRIELS PRÉSENTS" : "RAPPORT MATÉRIELS MANQUANTS";
        doc.setFontSize(16);
        doc.text(reportTitle, pageWidth / 2, 45, { align: 'center' });

        const tableData = type === 'scanned'
            ? scannedItems.map((i: any) => [i.materiel?.nom, i.materiel?.numero_inventaire, i.materiel?.service || '-', i.agent_name, new Date(i.created_at).toLocaleDateString()])
            : missingItems.map((i: any) => [i.nom, i.numero_inventaire, i.service || '-']);

        const tableHead = type === 'scanned'
            ? [['Nom', 'N° Inventaire', 'Service', 'Scanné par', 'Date']]
            : [['Nom', 'N° Inventaire', 'Service']];

        (doc as any).autoTable({
            startY: 78,
            head: tableHead,
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: type === 'scanned' ? [27, 54, 93] : [192, 0, 0] },
            didDrawPage: () => {
                if (headerBase64) doc.addImage(headerBase64, 'PNG', 0, 0, pageWidth, 30);
                if (footerBase64) doc.addImage(footerBase64, 'PNG', 0, pageHeight - 20, pageWidth, 20);
            }
        });

        doc.save(`Rapport_${type}_${inventaireInfo?.nom}.pdf`);
    };

    if (loading) return <div className="p-20 text-center font-black text-gst-dark tracking-widest animate-pulse">CHARGEMENT DES DONNÉES...</div>;

    const total = scannedItems.length + missingItems.length;
    const progress = total > 0 ? Math.round((scannedItems.length / total) * 100) : 0;

    return (
        <div className="max-w-7xl mx-auto animate-fade-in px-4">
            <Link to="/inventaire" className="inline-flex items-center text-gray-400 mb-8 hover:text-gst-dark font-black tracking-widest text-[10px] uppercase bg-white px-4 py-2 rounded-full shadow-sm transition-all">
                <ArrowLeft className="w-3 h-3 mr-2" /> Retour aux Campagnes
            </Link>

            <div className="bg-white rounded-[48px] shadow-2xl p-10 mb-10 border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gst-light/5 rounded-full blur-3xl -mr-32 -mt-32"></div>

                <div className="flex flex-col md:flex-row justify-between items-start mb-10 gap-8 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="bg-gst-dark p-4 rounded-3xl text-white shadow-xl">
                            <FileText size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-gst-dark uppercase tracking-tight">{inventaireInfo?.nom}</h1>
                            <div className="flex items-center gap-4 mt-2">
                                <span className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    <Calendar className="w-3 h-3 mr-2 text-gst-light" />
                                    Initialisé le {new Date(inventaireInfo?.date_debut).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button onClick={() => handleGeneratePDF('scanned')} className="bg-gst-dark text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gst-light transition-all flex items-center gap-2 shadow-lg shadow-gst-dark/10">
                            <Download className="w-4 h-4" /> Rapport Présents
                        </button>
                        <button onClick={() => handleGeneratePDF('missing')} className="bg-white text-red-600 border-2 border-red-50 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 transition-all flex items-center gap-2">
                            <Download className="w-4 h-4" /> Rapport Manquants
                        </button>
                    </div>
                </div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-slate-50 p-6 rounded-[32px] border border-gray-100">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Progression Globale</span>
                        <div className="flex items-end gap-3">
                            <span className="text-4xl font-black text-gst-dark leading-none">{progress}%</span>
                            <div className="flex-1 h-3 bg-gray-200 rounded-full mb-1 overflow-hidden">
                                <div className="h-full bg-gst-light animate-shrink origin-left" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-green-50/50 p-6 rounded-[32px] border border-green-100">
                        <span className="text-[10px] font-black text-green-600/60 uppercase tracking-widest block mb-2">Articles Identifiés</span>
                        <div className="flex items-center gap-4">
                            <div className="bg-white p-2 rounded-xl text-green-600 shadow-sm"><CheckCircle size={20} /></div>
                            <span className="text-3xl font-black text-green-700">{scannedItems.length}</span>
                        </div>
                    </div>
                    <div className="bg-red-50/50 p-6 rounded-[32px] border border-red-100">
                        <span className="text-[10px] font-black text-red-600/60 uppercase tracking-widest block mb-2">Articles Manquants</span>
                        <div className="flex items-center gap-4">
                            <div className="bg-white p-2 rounded-xl text-red-600 shadow-sm"><XCircle size={20} /></div>
                            <span className="text-3xl font-black text-red-700">{missingItems.length}</span>
                        </div>
                    </div>
                </div>

                {/* Tabs & Table */}
                <div className="flex gap-4 mb-8">
                    <button
                        onClick={() => setActiveTab('scanned')}
                        className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-3 ${activeTab === 'scanned' ? 'bg-gst-dark text-white shadow-xl shadow-gst-dark/20' : 'bg-slate-50 text-gray-400 hover:bg-slate-100'}`}
                    >
                        <Database className="w-4 h-4" /> Base Recueillie
                    </button>
                    <button
                        onClick={() => setActiveTab('missing')}
                        className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-3 ${activeTab === 'missing' ? 'bg-red-600 text-white shadow-xl shadow-red-200' : 'bg-slate-50 text-gray-400 hover:bg-slate-100'}`}
                    >
                        <Users className="w-4 h-4" /> Manquants au Registre
                    </button>
                </div>

                <div className="overflow-x-auto rounded-[32px] border border-gray-50">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Matériel Clinique</th>
                                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Affectation</th>
                                {activeTab === 'scanned' && (
                                    <>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Opérateur</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Horodatage</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {activeTab === 'scanned' ? (
                                scannedItems.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50 group transition-all">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden flex-shrink-0">
                                                    {item.materiel.photo_url ? (
                                                        <img
                                                            src={item.materiel.photo_url.startsWith('http') ? item.materiel.photo_url : `https://hckfizhzvslhyxsaftnx.supabase.co/storage/v1/object/public/materiel-photos/${item.materiel.photo_url}`}
                                                            className="h-full w-full object-cover"
                                                            alt=""
                                                        />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center text-[10px] font-black text-gray-200">IMG</div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-black text-gst-dark uppercase text-xs tracking-tight">{item.materiel.nom}</div>
                                                    <div className="text-[10px] font-mono text-gst-light font-black tracking-tighter">{item.materiel.numero_inventaire}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center text-[10px] font-black text-gray-500 uppercase tracking-widest">{item.materiel.service || 'Non spécifié'}</td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="bg-gst-dark/5 text-gst-dark text-[10px] font-black px-3 py-1 rounded-full border border-gst-dark/10">{item.agent_name}</span>
                                        </td>
                                        <td className="px-8 py-6 text-right text-[10px] font-mono font-bold text-gray-400">{new Date(item.created_at).toLocaleTimeString()}</td>
                                    </tr>
                                ))
                            ) : (
                                missingItems.map(item => (
                                    <tr key={item.id} className="hover:bg-red-50 group transition-all">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-white border border-red-50 shadow-sm overflow-hidden flex-shrink-0 grayscale opacity-50">
                                                    {item.photo_url ? (
                                                        <img
                                                            src={item.photo_url.startsWith('http') ? item.photo_url : `https://hckfizhzvslhyxsaftnx.supabase.co/storage/v1/object/public/materiel-photos/${item.photo_url}`}
                                                            className="h-full w-full object-cover"
                                                            alt=""
                                                        />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center text-[10px] font-black text-gray-200">IMG</div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-black text-red-900 uppercase text-xs tracking-tight">{item.nom}</div>
                                                    <div className="text-[10px] font-mono text-red-500 font-black tracking-tighter">{item.numero_inventaire}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.service || 'Non spécifié'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    {((activeTab === 'scanned' && scannedItems.length === 0) || (activeTab === 'missing' && missingItems.length === 0)) && (
                        <div className="p-20 text-center text-gray-200 font-black uppercase tracking-[0.3em]">Aucune donnée disponible</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InventaireDetails;
