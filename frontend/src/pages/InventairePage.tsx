import React, { useState, useEffect, useRef } from 'react';
import { inventaireService } from '../services/supabaseApi';
import BarcodeScanner from '../components/BarcodeScanner';
import { Play, PlusCircle, CheckCircle, AlertTriangle, List, ArrowLeft, Trophy, BarChart2, Trash2, Package, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const InventairePage: React.FC = () => {
    const { user, role } = useAuth();
    const navigate = useNavigate();
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        audioRef.current = new Audio('https://www.soundjay.com/buttons/beep-01a.mp3');
        audioRef.current.load();
    }, []);

    const [view, setView] = useState<'list' | 'create' | 'scan'>('list');
    const [inventaireId, setInventaireId] = useState<number | null>(null);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [newInv, setNewInv] = useState({ nom: '', service_perimetre: '', date_debut: new Date().toISOString().split('T')[0] });
    const [scannedItems, setScannedItems] = useState<any[]>([]);
    const [lastScan, setLastScan] = useState<{ status: 'success' | 'error', msg: string, item?: any } | null>(null);
    const [pendingMateriel, setPendingMateriel] = useState<any | null>(null);
    const [myStats, setMyStats] = useState(0);
    const [isConfirming, setIsConfirming] = useState(false);
    const [isImgLoading, setIsImgLoading] = useState(true);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [lastSuccessfulCode, setLastSuccessfulCode] = useState<string | null>(null);
    const [lastRawCode, setLastRawCode] = useState<string | null>(null);

    useEffect(() => {
        loadCampaigns();
    }, []);

    useEffect(() => {
        if (inventaireId && user) {
            loadStats();
        }
    }, [inventaireId, user]);

    const loadCampaigns = async () => {
        try {
            const data = await inventaireService.getAll();
            setCampaigns(data || []);
        } catch (error) {
            console.error("Erreur chargement campagnes", error);
        }
    };

    const loadStats = async () => {
        if (!inventaireId || !user) return;
        setIsLoadingHistory(true);
        try {
            const stats = await inventaireService.getStats(inventaireId, user.id);
            setMyStats(stats.scannedCount);
            const history = await inventaireService.getLignesByInventaire(inventaireId);
            const mappedItems = history.map((h: any) => ({
                ...h.materiel,
                fromHistory: true
            }));
            setScannedItems(mappedItems);
        } catch (error) {
            console.error("Erreur stats/history", error);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = await inventaireService.create(newInv);
            alert(`Campagne "${data.nom}" créée!`);
            setInventaireId(data.id);
            setView('scan');
            loadCampaigns();
        } catch (error) {
            alert('Erreur création campagne');
            console.error(error);
        }
    };

    const handleDeleteCampaign = async (e: React.MouseEvent, id: number, name: string) => {
        e.stopPropagation();
        if (window.confirm(`Supprimer définitivement la campagne "${name}" et TOUS ses scans d'inventaire ?`)) {
            try {
                await inventaireService.delete(id);
                loadCampaigns();
            } catch (error) {
                alert('Erreur lors de la suppression');
                console.error(error);
            }
        }
    };

    const joinCampaign = (id: number) => {
        setInventaireId(id);
        setView('scan');
        setScannedItems([]);
        setLastScan(null);
    };

    const handleScan = async (code: string) => {
        setLastRawCode(code);
        if (!inventaireId || !user) return;
        if (pendingMateriel) return;
        if (code === lastSuccessfulCode) return;

        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => { });
        }

        try {
            const materiel = await inventaireService.getMaterielByCode(code);
            setIsImgLoading(true);
            setPendingMateriel(materiel);
        } catch (error) {
            setLastScan({ status: 'error', msg: 'Matériel non trouvé' });
        }
    };

    const confirmScan = async () => {
        if (!pendingMateriel || !inventaireId || !user || isConfirming) return;
        setIsConfirming(true);
        try {
            await inventaireService.confirmScan({
                inventaire_id: inventaireId,
                materiel_id: pendingMateriel.id,
                user_id: user.id
            });
            setLastScan({ status: 'success', msg: `Confirmé: ${pendingMateriel.nom} `, item: pendingMateriel });
            setScannedItems(prev => [pendingMateriel, ...prev]);
            setLastSuccessfulCode(pendingMateriel.numero_inventaire);
            setTimeout(() => setLastSuccessfulCode(null), 2000);
            setPendingMateriel(null);
            setMyStats(prev => prev + 1);
        } catch (error: any) {
            setLastScan({ status: 'error', msg: error.message || 'Erreur confirmation' });
            setPendingMateriel(null);
        } finally {
            setIsConfirming(false);
        }
    };

    const exitScan = () => {
        if (confirm("Quitter le mode scan ?")) {
            setInventaireId(null);
            setView('list');
            loadCampaigns();
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 animate-fade-in">
            <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
                <h1 className="text-3xl font-black text-gst-dark tracking-tight uppercase">
                    {view === 'scan' ? 'Zone de Collecte' : 'Campagnes Actives'}
                </h1>

                {view === 'scan' && (
                    <div className="flex items-center bg-gst-dark text-white px-8 py-4 rounded-[32px] font-black shadow-2xl animate-in zoom-in duration-300 border-2 border-gst-light/20">
                        <Trophy className="w-6 h-6 mr-3 text-gst-light" />
                        <span className="text-xl">{myStats} Articles Scannés</span>
                    </div>
                )}
            </div>

            {view === 'list' && (
                <div className="space-y-10">
                    {role === 'admin' && (
                        <button
                            onClick={() => setView('create')}
                            className="bg-gst-dark text-white px-10 py-5 rounded-[24px] font-black shadow-xl shadow-gst-dark/20 hover:bg-gst-light transition-all hover:-translate-y-1 flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
                        >
                            <PlusCircle className="w-5 h-5" /> Nouvelle Mission
                        </button>
                    )}

                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                        {campaigns.map(camp => (
                            <div key={camp.id} className="group bg-white p-10 rounded-[40px] shadow-xl border border-gray-100 hover:border-gst-light transition-all hover:shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {role === 'admin' && (
                                        <button
                                            onClick={(e) => handleDeleteCampaign(e, camp.id, camp.nom)}
                                            className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>

                                <div className="mb-6">
                                    <span className="text-[10px] font-black text-gst-light uppercase tracking-[0.2em]">CHU Mohammed VI</span>
                                    <h3 className="text-2xl font-black mt-1 text-gst-dark group-hover:text-gst-light transition-colors uppercase tracking-tight">{camp.nom}</h3>
                                </div>

                                <div className="space-y-4 mb-10">
                                    <div className="flex items-center text-gray-500 font-bold text-sm">
                                        <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center mr-4 text-gst-light text-lg">📅</div>
                                        <span>Début : {new Date(camp.date_debut).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center text-gray-500 font-bold text-sm">
                                        <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center mr-4 text-gst-light text-lg">📍</div>
                                        <span className="truncate">{camp.service_perimetre || 'Périmètre Global'}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <button
                                        onClick={() => joinCampaign(camp.id)}
                                        className="w-full bg-gst-dark text-white py-5 rounded-[24px] font-black hover:bg-gst-light transition shadow-xl shadow-gst-dark/10 flex items-center justify-center uppercase tracking-widest text-xs"
                                    >
                                        <Play className="w-4 h-4 mr-2 fill-current" /> Démarrer le scan
                                    </button>
                                    {role === 'admin' && (
                                        <button
                                            onClick={() => navigate(`/inventaire/${camp.id}`)}
                                            className="w-full bg-slate-50 text-gst-dark py-5 rounded-[24px] font-black border border-gray-100 hover:bg-white hover:border-gst-light transition flex items-center justify-center uppercase tracking-widest text-[10px]"
                                        >
                                            <BarChart2 className="w-4 h-4 mr-2" /> Rapport de mission
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    {campaigns.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-gray-200">
                            <List className="w-20 h-20 mx-auto mb-6 text-gray-100" />
                            <p className="text-gray-400 font-black text-xl uppercase tracking-widest">Aucune mission disponible</p>
                        </div>
                    )}
                </div>
            )}

            {view === 'scan' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <button onClick={exitScan} className="lg:col-span-12 w-fit text-gray-400 flex items-center hover:text-red-600 mb-2 font-black transition-colors uppercase tracking-[0.2em] text-[10px] bg-white px-4 py-2 rounded-full shadow-sm">
                        <ArrowLeft className="w-3 h-3 mr-2" /> Retour / Changer
                    </button>

                    <div className="lg:col-span-12 xl:col-span-8 bg-white p-10 rounded-[48px] shadow-2xl border border-gray-100 relative overflow-hidden">
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gst-light/5 rounded-full blur-3xl -mr-32 -mt-32"></div>

                        <div className="flex justify-between items-center mb-10 relative z-10">
                            <h2 className="text-sm font-black text-gst-dark uppercase tracking-[0.3em]">Scanner Laser Actif</h2>
                            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl">
                                <div className={`w-3 h-3 rounded-full ${!pendingMateriel && !lastSuccessfulCode ? 'bg-green-500 animate-pulse shadow-lg shadow-green-200' : 'bg-amber-500 animate-pulse shadow-lg shadow-amber-200'}`}></div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                    {!pendingMateriel && !lastSuccessfulCode ? 'En attente' : 'Pause'}
                                </span>
                            </div>
                        </div>

                        <div className="relative aspect-video max-h-[600px] flex items-center justify-center bg-gst-dark rounded-[40px] overflow-hidden shadow-2xl border-[12px] border-white ring-1 ring-gray-100">
                            <BarcodeScanner
                                isPaused={!!pendingMateriel || !!lastSuccessfulCode}
                                onScanSuccess={handleScan}
                            />

                            {(pendingMateriel || lastSuccessfulCode) && (
                                <div className="absolute inset-0 z-20 bg-gst-dark/95 backdrop-blur-md flex flex-col items-center justify-center text-white text-center p-10 animate-in fade-in duration-500">
                                    <div className="bg-white p-8 rounded-full mb-8 shadow-[0_0_50px_rgba(255,255,255,0.3)] animate-pulse">
                                        <CheckCircle className="w-16 h-16 text-gst-dark" />
                                    </div>
                                    <h3 className="text-3xl font-black mb-4 uppercase tracking-tighter">
                                        {pendingMateriel ? 'Article Identifié' : 'Traitement...'}
                                    </h3>
                                    <p className="text-gst-light font-black text-xl mb-10 tracking-widest">
                                        {pendingMateriel ? pendingMateriel.numero_inventaire : "Prêt"}
                                    </p>
                                    {!pendingMateriel && (
                                        <div className="w-full max-w-xs h-3 bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-gst-light animate-shrink" style={{ animationDuration: '2.5s' }}></div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {lastScan && !pendingMateriel && (
                            <div className={`mt-10 p-8 rounded-[32px] font-black flex items-center justify-center animate-in slide-in-from-bottom-4 shadow-xl ${lastScan.status === 'success' ? 'bg-green-50 text-green-700 border-2 border-green-100 shadow-green-100' : 'bg-red-50 text-red-700 border-2 border-red-100 shadow-red-100'}`}>
                                {lastScan.status === 'success' ? <CheckCircle className="w-10 h-10 mr-4" /> : <AlertTriangle className="w-10 h-10 mr-4" />}
                                <span className="text-xl uppercase tracking-tight">{lastScan.msg}</span>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-12 xl:col-span-4 flex flex-col gap-8">
                        {/* Validation Card (Mobile Float / Side) */}
                        {pendingMateriel && (
                            <div className="bg-gst-dark rounded-[40px] p-10 shadow-3xl animate-in slide-in-from-right duration-500 text-white border-4 border-gst-light/20 scale-105 origin-top">
                                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gst-light mb-8 text-center underline decoration-gst-light/50 underline-offset-8">Confirmation Requise</h2>

                                <div className="aspect-square bg-white rounded-[32px] overflow-hidden mb-8 shadow-2xl ring-4 ring-white/10 relative">
                                    {pendingMateriel.photo_url ? (
                                        <img
                                            src={pendingMateriel.photo_url.startsWith('http') ? pendingMateriel.photo_url : `https://hckfizhzvslhyxsaftnx.supabase.co/storage/v1/object/public/materiel-photos/${pendingMateriel.photo_url}`}
                                            alt="" className={`w-full h-full object-cover transition-opacity duration-300 ${isImgLoading ? 'opacity-0' : 'opacity-100'}`}
                                            onLoad={() => setIsImgLoading(false)}
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-200">
                                            <Package size={64} className="mb-4 opacity-10" />
                                        </div>
                                    )}
                                </div>

                                <div className="text-center mb-10">
                                    <p className="text-2xl font-black uppercase tracking-tighter leading-tight mb-2">{pendingMateriel.nom}</p>
                                    <p className="text-xs font-black text-gst-light bg-gst-light/10 inline-block px-4 py-2 rounded-xl">SN: {pendingMateriel.numero_inventaire}</p>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <button onClick={confirmScan} disabled={isConfirming} className="w-full bg-white text-gst-dark py-6 rounded-[24px] font-black text-lg shadow-xl hover:bg-gst-light hover:text-white transition-all transform active:scale-95 uppercase">
                                        {isConfirming ? 'Envoi...' : 'Valider'}
                                    </button>
                                    <button onClick={() => setPendingMateriel(null)} className="w-full bg-white/5 text-white/40 py-4 rounded-[24px] font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">
                                        Ignorer
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-gray-100 flex-1 flex flex-col overflow-hidden">
                            <div className="flex justify-between items-center mb-10">
                                <h2 className="text-sm font-black text-gst-dark uppercase tracking-[0.3em]">Historique Live</h2>
                                <button onClick={loadStats} className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-gst-light hover:bg-gst-light hover:text-white transition-all shadow-sm">
                                    <List className={`w-5 h-5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                            <ul className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
                                {scannedItems.map((item, idx) => (
                                    <li key={idx} className="p-5 bg-slate-50 rounded-[28px] flex justify-between items-center group transition-all hover:bg-gst-dark hover:shadow-xl border border-transparent hover:border-gst-light/20">
                                        <div className="flex items-center gap-4">
                                            <div className="w-3 h-3 rounded-full bg-gst-light shadow-[0_0_15px_rgba(0,163,224,0.5)]"></div>
                                            <div>
                                                <span className="font-black block text-gst-dark group-hover:text-white transition-colors uppercase text-xs tracking-tight">{item.nom}</span>
                                                <span className="text-[10px] text-gray-400 group-hover:text-white/40 transition-colors font-bold uppercase tracking-widest">{item.numero_inventaire}</span>
                                            </div>
                                        </div>
                                        <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 group-hover:bg-gst-light group-hover:border-transparent transition-all">
                                            <CheckCircle className="w-4 h-4 text-gst-light group-hover:text-white" />
                                        </div>
                                    </li>
                                ))}
                                {scannedItems.length === 0 && (
                                    <div className="text-center py-24 text-gray-400">
                                        <Database size={48} className="mx-auto mb-6 opacity-5" />
                                        <p className="font-black uppercase tracking-[0.2em] text-[10px]">Aucune donnée</p>
                                    </div>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventairePage;
