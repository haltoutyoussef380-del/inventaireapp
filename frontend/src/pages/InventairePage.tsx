import React, { useState, useEffect, useRef } from 'react';
import { inventaireService } from '../services/supabaseApi';
import BarcodeScanner from '../components/BarcodeScanner';
import { Play, PlusCircle, CheckCircle, AlertTriangle, List, ArrowLeft, Trophy, BarChart2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const InventairePage: React.FC = () => {
    const { user, role } = useAuth();
    const navigate = useNavigate();
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        audioRef.current = new Audio('https://www.soundjay.com/buttons/beep-01a.mp3');
        // Pre-load to avoid delay on first scan
        audioRef.current.load();
    }, []);

    // Navigation
    const [view, setView] = useState<'list' | 'create' | 'scan'>('list');
    const [inventaireId, setInventaireId] = useState<number | null>(null);
    const [campaigns, setCampaigns] = useState<any[]>([]);

    // Formulaire Création (Admin only)
    const [newInv, setNewInv] = useState({ nom: '', service_perimetre: '', date_debut: new Date().toISOString().split('T')[0] });

    // État Scan
    const [scannedItems, setScannedItems] = useState<any[]>([]);
    const [lastScan, setLastScan] = useState<{ status: 'success' | 'error', msg: string, item?: any } | null>(null);
    const [pendingMateriel, setPendingMateriel] = useState<any | null>(null);
    const [myStats, setMyStats] = useState(0);
    const [isConfirming, setIsConfirming] = useState(false);
    const [isImgLoading, setIsImgLoading] = useState(true);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [lastSuccessfulCode, setLastSuccessfulCode] = useState<string | null>(null);
    const [scannerKey, setScannerKey] = useState(0);
    const [lastRawCode, setLastRawCode] = useState<string | null>(null);

    // Chargement des campagnes au démarrage
    useEffect(() => {
        loadCampaigns();
    }, []);

    // Chargement des stats quand on rejoint un inventaire
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
        e.stopPropagation(); // Evite de rejoindre par accident
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

        if (code === lastSuccessfulCode) {
            console.log("Ignoré: Cooldown sur le code:", code);
            return;
        }

        // Bip immédiat
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch((e: any) => {
                if (e.name !== 'AbortError') console.warn("Audio play error", e);
            });
        }

        try {
            const materiel = await inventaireService.getMaterielByCode(code);
            setIsImgLoading(true);
            setPendingMateriel(materiel);
        } catch (error: any) {
            console.error(error);
            setLastScan({ status: 'error', msg: 'Matériel non trouvé ou erreur' });
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
            setTimeout(() => {
                setLastSuccessfulCode(null);
                setScannerKey(prev => prev + 1);
            }, 2000); // Réduit à 2s

            setPendingMateriel(null);
            setMyStats(prev => prev + 1);

        } catch (error: any) {
            console.error(error);
            const msg = error.message || 'Erreur confirmation';
            setLastScan({ status: 'error', msg });

            if (pendingMateriel) {
                setLastSuccessfulCode(pendingMateriel.numero_inventaire);
                setTimeout(() => {
                    setLastSuccessfulCode(null);
                    setScannerKey(prev => prev + 1);
                }, 2000);
            }

            setPendingMateriel(null);
        } finally {
            setIsConfirming(false);
        }
    };

    const cancelScan = () => {
        setPendingMateriel(null);
        setLastScan({ status: 'error', msg: 'Scan annulé' });
    };

    const exitScan = () => {
        if (confirm("Quitter le mode scan ?")) {
            setInventaireId(null);
            setView('list');
            loadCampaigns();
        }
    };

    return (
        <div className="relative min-h-screen bg-gray-50 pb-20 p-4 md:p-6 animate-fade-in">
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                <h1 className="text-3xl font-black text-gray-800 tracking-tight">
                    {view === 'scan' ? 'Mode Scan' : 'Campagnes d\'Inventaire'}
                </h1>

                {view === 'scan' && (
                    <div className="flex items-center bg-blue-600 text-white px-6 py-3 rounded-2xl font-black shadow-xl animate-in zoom-in duration-300">
                        <Trophy className="w-6 h-6 mr-3 text-blue-200" />
                        <span className="text-lg">{myStats} Scans réalisés</span>
                    </div>
                )}
            </div>

            {view === 'list' && (
                <div className="space-y-8">
                    {role === 'admin' && (
                        <button
                            onClick={() => setView('create')}
                            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl hover:bg-blue-700 transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
                        >
                            <PlusCircle className="w-5 h-5" /> Nouvelle Campagne
                        </button>
                    )}

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {campaigns.map(camp => (
                            <div key={camp.id} className="group bg-white p-8 rounded-3xl shadow-lg border border-gray-100 hover:border-blue-500 transition-all hover:shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {role === 'admin' && (
                                        <button
                                            onClick={(e) => handleDeleteCampaign(e, camp.id, camp.nom)}
                                            className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                                            title="Supprimer la campagne"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>

                                <h3 className="text-2xl font-black mb-4 text-gray-900 group-hover:text-blue-600 transition-colors">{camp.nom}</h3>

                                <div className="space-y-3 mb-8">
                                    <div className="flex items-center text-gray-500 font-medium">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center mr-3">📅</div>
                                        <span>Début: {new Date(camp.date_debut).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center text-gray-500 font-medium">
                                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center mr-3">📍</div>
                                        <span className="truncate">{camp.service_perimetre || 'Tout service'}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => joinCampaign(camp.id)}
                                        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 transition shadow-lg shadow-blue-100 flex items-center justify-center"
                                    >
                                        <Play className="w-5 h-5 mr-2 fill-current" /> Rejoindre le scan
                                    </button>
                                    {role === 'admin' && (
                                        <button
                                            onClick={() => navigate(`/inventaire/${camp.id}`)}
                                            className="w-full bg-gray-50 text-gray-700 py-4 rounded-2xl font-bold border border-gray-100 hover:bg-gray-100 transition flex items-center justify-center"
                                        >
                                            <BarChart2 className="w-5 h-5 mr-2" /> Rapport Complet
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    {campaigns.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                            <List className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                            <p className="text-gray-400 font-bold text-xl">Aucune campagne active.</p>
                        </div>
                    )}
                </div>
            )}

            {view === 'create' && (
                <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-lg mx-auto border border-gray-50 animate-in slide-in-from-bottom duration-500">
                    <button onClick={() => setView('list')} className="text-gray-400 mb-6 flex items-center hover:text-gray-900 font-bold transition-colors">
                        <ArrowLeft className="w-5 h-5 mr-2" /> Revenir à la liste
                    </button>
                    <h2 className="text-3xl font-black mb-8 text-gray-900">Initialiser une Campagne</h2>
                    <form onSubmit={handleCreate} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-black text-gray-500 uppercase tracking-widest pl-1">Nom du projet</label>
                            <input type="text" className="w-full border-2 border-gray-100 p-4 rounded-2xl focus:border-blue-500 focus:outline-none transition-colors font-bold text-gray-800" required
                                value={newInv.nom} onChange={e => setNewInv({ ...newInv, nom: e.target.value })}
                                placeholder="ex: Inventaire Annuel 2026" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-black text-gray-500 uppercase tracking-widest pl-1">Périmètre / Service</label>
                            <input type="text" className="w-full border-2 border-gray-100 p-4 rounded-2xl focus:border-blue-500 focus:outline-none transition-colors font-bold text-gray-800"
                                value={newInv.service_perimetre} onChange={e => setNewInv({ ...newInv, service_perimetre: e.target.value })}
                                placeholder="ex: Chirurgie / Tous" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-black text-gray-500 uppercase tracking-widest pl-1">Date d'ouverture</label>
                            <input type="date" className="w-full border-2 border-gray-100 p-4 rounded-2xl focus:border-blue-500 focus:outline-none transition-colors font-bold text-gray-800" required
                                value={newInv.date_debut} onChange={e => setNewInv({ ...newInv, date_debut: e.target.value })} />
                        </div>
                        <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-blue-700 shadow-2xl shadow-blue-200 transition-all hover:-translate-y-1">
                            Lancer la Campagne
                        </button>
                    </form>
                </div>
            )}

            {view === 'scan' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">

                    <button onClick={exitScan} className="lg:col-span-12 text-gray-400 flex items-center hover:text-red-600 mb-2 font-black transition-colors uppercase tracking-widest text-xs">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Retour / Changer de campagne
                    </button>

                    {pendingMateriel && (
                        <div className="fixed inset-0 z-50 bg-gray-900/90 backdrop-blur-md flex items-center justify-center p-4">
                            <div className="bg-white rounded-[32px] p-8 w-full max-w-sm shadow-2xl animate-in zoom-in duration-300">
                                <h2 className="text-2xl font-black text-center text-blue-900 mb-6 uppercase tracking-tight">Identification</h2>

                                <div className="aspect-square bg-gray-50 rounded-3xl overflow-hidden mb-6 border border-gray-100 relative shadow-inner">
                                    {pendingMateriel.photo_url ? (
                                        <>
                                            {isImgLoading && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                                                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent"></div>
                                                </div>
                                            )}
                                            <img
                                                src={pendingMateriel.photo_url.startsWith('http')
                                                    ? pendingMateriel.photo_url
                                                    : `https://hckfizhzvslhyxsaftnx.supabase.co/storage/v1/object/public/materiel-photos/${pendingMateriel.photo_url}`}
                                                alt=""
                                                className={`w-full h-full object-cover transition-opacity duration-500 ${isImgLoading ? 'opacity-0' : 'opacity-100'}`}
                                                onLoad={() => setIsImgLoading(false)}
                                                onError={(e) => {
                                                    setIsImgLoading(false);
                                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=IMG+Introuvable';
                                                }}
                                            />
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-300">
                                            <List size={48} className="mb-2 opacity-20" />
                                            <span className="font-bold">Aucune image</span>
                                        </div>
                                    )}
                                </div>

                                <div className="text-center mb-8">
                                    <p className="text-2xl font-black text-gray-900 leading-tight mb-2 uppercase tracking-tighter">{pendingMateriel.nom}</p>
                                    <p className="text-sm font-mono text-blue-600 bg-blue-50 inline-block px-4 py-1.5 rounded-full font-bold">{pendingMateriel.numero_inventaire}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={cancelScan}
                                        className="py-5 rounded-3xl font-black text-gray-400 bg-gray-50 hover:bg-gray-100 transition-colors uppercase tracking-widest text-xs"
                                    >
                                        Ignorer
                                    </button>
                                    <button
                                        onClick={confirmScan}
                                        disabled={isConfirming}
                                        className={`py-5 rounded-3xl font-black text-white shadow-xl transition-all transform active:scale-95 uppercase tracking-widest text-xs ${isConfirming ? 'bg-gray-300' : 'bg-green-600 hover:bg-green-700 shadow-green-100'}`}
                                    >
                                        {isConfirming ? 'Envoi...' : 'Enregistrer'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="lg:col-span-12 xl:col-span-8 bg-white p-8 rounded-[32px] shadow-xl border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-gray-800 uppercase tracking-widest">Zone de Scan</h2>
                            <button
                                onClick={() => setScannerKey(k => k + 1)}
                                className="text-[10px] font-black uppercase tracking-widest bg-gray-50 px-3 py-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
                            >
                                Réinitialiser Caméra
                            </button>
                        </div>

                        {lastRawCode && (
                            <div className="mb-4 text-[11px] font-black font-mono bg-yellow-400 text-yellow-900 p-2 rounded-xl text-center uppercase tracking-tighter">
                                DEBUG : {lastRawCode} 📡
                            </div>
                        )}

                        <div className="relative aspect-[4/3] max-h-[500px] flex items-center justify-center bg-gray-900 rounded-[28px] overflow-hidden shadow-2xl border-4 border-white">
                            {!pendingMateriel && !lastSuccessfulCode ? (
                                <BarcodeScanner
                                    key={scannerKey}
                                    onScanSuccess={handleScan}
                                />
                            ) : (
                                <div className="absolute inset-0 z-10 bg-blue-900/90 backdrop-blur-lg flex flex-col items-center justify-center text-white text-center p-8">
                                    <div className="bg-white p-6 rounded-full mb-6 shadow-2xl animate-bounce">
                                        <CheckCircle className="w-12 h-12 text-blue-600" />
                                    </div>
                                    <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">
                                        {pendingMateriel ? 'Validation...' : 'Scan Suivant'}
                                    </h3>
                                    <p className="text-blue-100 font-bold mb-8">
                                        {pendingMateriel
                                            ? `ID: ${pendingMateriel.numero_inventaire}`
                                            : "Réinitialisation de la caméra..."}
                                    </p>
                                    {!pendingMateriel && (
                                        <div className="w-full max-w-[150px] h-2 bg-white/20 rounded-full overflow-hidden">
                                            <div className="h-full bg-white animate-shrink" style={{ animationDuration: '2s' }}></div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {lastScan && !pendingMateriel && (
                            <div className={`mt-8 p-6 rounded-2xl text-center font-black flex items-center justify-center animate-in slide-in-from-top-2 shadow-sm ${lastScan.status === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                {lastScan.status === 'success' ? <CheckCircle className="w-8 h-8 mr-3" /> : <AlertTriangle className="w-8 h-8 mr-3" />}
                                <span className="text-lg">{lastScan.msg}</span>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-12 xl:col-span-4 bg-white p-8 rounded-[32px] shadow-xl border border-gray-100">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-black text-gray-800 uppercase tracking-widest">Flux Récent</h2>
                            <button
                                onClick={loadStats}
                                disabled={isLoadingHistory}
                                className="text-blue-600 hover:text-blue-800 text-xs font-black uppercase tracking-widest flex items-center disabled:opacity-50"
                            >
                                <Play className={`w-3 h-3 mr-2 rotate-90 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                                Sync
                            </button>
                        </div>
                        <ul className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {scannedItems.map((item, idx) => (
                                <li key={idx} className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center group transition-all hover:bg-white hover:shadow-md border border-transparent hover:border-blue-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-200"></div>
                                        <div>
                                            <span className="font-black block text-gray-900 leading-tight uppercase text-sm">{item.nom}</span>
                                            <span className="text-[10px] text-gray-400 font-mono font-bold tracking-tighter">{item.numero_inventaire}</span>
                                        </div>
                                    </div>
                                    <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                    </div>
                                </li>
                            ))}
                            {scannedItems.length === 0 && (
                                <div className="text-center py-20 text-gray-400 flex flex-col items-center">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                        <List className="w-8 h-8 opacity-20" />
                                    </div>
                                    <p className="font-bold uppercase tracking-widest text-[10px]">En attente de scans...</p>
                                </div>
                            )}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventairePage;
