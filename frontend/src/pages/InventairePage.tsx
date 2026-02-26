import React, { useState, useEffect } from 'react';
import { inventaireService } from '../services/supabaseApi';
import BarcodeScanner from '../components/BarcodeScanner';
import { Play, PlusCircle, CheckCircle, AlertTriangle, List, ArrowLeft, Trophy, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const InventairePage: React.FC = () => {
    const { user, role } = useAuth();
    const navigate = useNavigate();

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
    const [lastSuccessfulCode, setLastSuccessfulCode] = useState<string | null>(null); // Parent-level cooldown
    const [scannerKey, setScannerKey] = useState(0); // Forcer le remount physique
    const [lastRawCode, setLastRawCode] = useState<string | null>(null); // Debug: dernier code "lu"

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

            // Charger aussi l'historique complet pour la liste
            const history = await inventaireService.getLignesByInventaire(inventaireId);
            const mappedItems = history.map((h: any) => ({
                ...h.materiel,
                fromHistory: true // optionnel: pour marquer que ça vient de la base
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
            loadCampaigns(); // Rafraichir la liste pour plus tard
        } catch (error) {
            alert('Erreur création campagne');
            console.error(error);
        }
    };

    const joinCampaign = (id: number) => {
        setInventaireId(id);
        setView('scan');
        setScannedItems([]); // Reset local list
        setLastScan(null);
    };

    const handleScan = async (code: string) => {
        setLastRawCode(code); // Debug trace
        if (!inventaireId || !user) return;
        if (pendingMateriel) return;

        // Empêcher de rescanner immédiatement le même objet (cooldown parent)
        if (code === lastSuccessfulCode) {
            console.log("Ignoré: Cooldown sur le code:", code);
            return;
        }

        try {
            const materiel = await inventaireService.getMaterielByCode(code);
            console.log("Materiel scanné:", materiel);
            setIsImgLoading(true); // Reset loading state for new image
            setPendingMateriel(materiel);
            const audio = new Audio('/beep.mp3');
            audio.play().catch(() => { });
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

            // Activer le cooldown sur ce code pour 4 secondes
            setLastSuccessfulCode(pendingMateriel.numero_inventaire);
            setTimeout(() => {
                setLastSuccessfulCode(null);
                setScannerKey(prev => prev + 1); // Forcer un nouveau "mount" frais de la caméra
            }, 4000);

            setPendingMateriel(null);

            // Mise à jour du compteur
            setMyStats(prev => prev + 1);

        } catch (error: any) {
            console.error(error);
            const msg = error.message || 'Erreur confirmation';
            setLastScan({ status: 'error', msg });

            // En cas d'erreur (doublon ou autre), on active quand même le cooldown sur cet objet 
            // pour permettre à l'utilisateur de passer à l'objet suivant sans boucle infinie.
            if (pendingMateriel) {
                setLastSuccessfulCode(pendingMateriel.numero_inventaire);
                setTimeout(() => {
                    setLastSuccessfulCode(null);
                    setScannerKey(prev => prev + 1); // Nouveau cycle
                }, 5000);
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
            loadCampaigns(); // Refresh stats/list potentially
        }
    };

    return (
        <div className="relative min-h-screen bg-gray-50 pb-20">
            {/* Header spécifique scan ou liste */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800">
                    {view === 'scan' ? 'Mode Scan' : 'Campagnes d\'Inventaire'}
                </h1>

                {view === 'scan' && (
                    <div className="flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-bold shadow-sm">
                        <Trophy className="w-5 h-5 mr-2 text-blue-600" />
                        <span>{myStats} Scans</span>
                    </div>
                )}
                {/* DEBUG ROLE to help user */}
                <div className="text-xs text-gray-400 absolute top-0 right-0 mt-2 mr-2">
                    Role: {role} (User: {user?.email})
                </div>
            </div>

            {/* VUE LISTE DES CAMPAGNES */}
            {view === 'list' && (
                <div className="space-y-6">
                    {role === 'admin' && (
                        <button
                            onClick={() => setView('create')}
                            className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg font-bold shadow hover:bg-blue-700 flex items-center justify-center"
                        >
                            <PlusCircle className="mr-2" /> Nouvelle Campagne
                        </button>
                    )}

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {campaigns.map(camp => (
                            <div key={camp.id} className="bg-white p-6 rounded-xl shadow-md border hover:border-blue-300 transition-colors">
                                <h3 className="text-xl font-bold mb-2 text-gray-800">{camp.nom}</h3>
                                <div className="text-gray-500 text-sm mb-4 space-y-1">
                                    <p>📅 Début: {new Date(camp.date_debut).toLocaleDateString()}</p>
                                    <p>📍 {camp.service_perimetre || 'Non spécifié'}</p>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => joinCampaign(camp.id)}
                                        className="flex-1 bg-green-50 text-green-700 border border-green-200 py-2 rounded-lg font-bold hover:bg-green-100 flex items-center justify-center"
                                    >
                                        <Play className="w-4 h-4 mr-2" /> Rejoindre
                                    </button>
                                    {role === 'admin' && (
                                        <button
                                            onClick={() => navigate(`/inventaire/${camp.id}`)}
                                            className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-purple-700 shadow flex items-center justify-center ml-2"
                                            title="Tableau de bord"
                                        >
                                            <BarChart2 className="w-4 h-4 mr-2" /> Tableau de Bord
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    {campaigns.length === 0 && <p className="text-center text-gray-500 mt-10">Aucune campagne active.</p>}
                </div>
            )}

            {/* VUE CRÉATION (Admin) */}
            {view === 'create' && (
                <div className="bg-white p-6 rounded-xl shadow-lg max-w-lg mx-auto">
                    <button onClick={() => setView('list')} className="text-gray-500 mb-4 flex items-center hover:text-gray-700">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Retour liste
                    </button>
                    <h2 className="text-xl font-bold mb-4">Nouvelle Campagne</h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium">Nom de la campagne</label>
                            <input type="text" className="w-full border p-3 rounded-lg" required
                                value={newInv.nom} onChange={e => setNewInv({ ...newInv, nom: e.target.value })}
                                placeholder="ex: Inventaire 2026 - Pôle A" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Service / Périmètre</label>
                            <input type="text" className="w-full border p-3 rounded-lg"
                                value={newInv.service_perimetre} onChange={e => setNewInv({ ...newInv, service_perimetre: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Date Début</label>
                            <input type="date" className="w-full border p-3 rounded-lg" required
                                value={newInv.date_debut} onChange={e => setNewInv({ ...newInv, date_debut: e.target.value })} />
                        </div>
                        <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 shadow">
                            Créer et Commencer
                        </button>
                    </form>
                </div>
            )}

            {/* VUE SCAN */}
            {view === 'scan' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">

                    <button onClick={exitScan} className="lg:col-span-2 text-gray-500 flex items-center hover:text-red-600 mb-2">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Changer de campagne (Quitter)
                    </button>

                    {/* MODALE VALIDATION */}
                    {pendingMateriel && (
                        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-300">
                                <h2 className="text-2xl font-bold text-center text-blue-900 mb-4">Vérification</h2>

                                <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-4 border-2 border-gray-200 relative">
                                    {pendingMateriel.photo_url ? (
                                        <>
                                            {isImgLoading && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                                </div>
                                            )}
                                            <img
                                                src={pendingMateriel.photo_url.startsWith('http')
                                                    ? pendingMateriel.photo_url
                                                    : `https://hckfizhzvslhyxsaftnx.supabase.co/storage/v1/object/public/materiel-photos/${pendingMateriel.photo_url}`}
                                                alt="Materiel"
                                                className={`w-full h-full object-cover transition-opacity duration-300 ${isImgLoading ? 'opacity-0' : 'opacity-100'}`}
                                                onLoad={() => setIsImgLoading(false)}
                                                onError={(e) => {
                                                    console.error("Erreur chargement image:", pendingMateriel.photo_url);
                                                    setIsImgLoading(false);
                                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=Image+Introuvable';
                                                }}
                                            />
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                            <span>Pas de photo</span>
                                        </div>
                                    )}
                                </div>

                                <div className="text-center mb-6 space-y-1">
                                    <p className="text-xl font-black text-gray-800 leading-tight">{pendingMateriel.nom}</p>
                                    <p className="text-sm font-mono text-gray-500 bg-gray-100 inline-block px-2 py-1 rounded">{pendingMateriel.numero_inventaire}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={cancelScan}
                                        className="py-4 rounded-xl font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                                    >
                                        Refuser
                                    </button>
                                    <button
                                        onClick={confirmScan}
                                        disabled={isConfirming}
                                        className={`py-4 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 ${isConfirming ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 shadow-green-200'}`}
                                    >
                                        {isConfirming ? 'Confirmation...' : 'Valider'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white p-4 rounded-xl shadow-md border-t-4 border-blue-500">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-lg font-bold text-gray-700">Scanner</h2>
                            <button
                                onClick={() => setScannerKey(k => k + 1)}
                                className="text-[10px] bg-gray-100 px-2 py-1 rounded hover:bg-gray-200 text-gray-500"
                            >
                                Reset Caméra (#{scannerKey})
                            </button>
                        </div>

                        {lastRawCode && (
                            <div className="mb-2 text-[10px] font-mono bg-yellow-50 p-1 border border-yellow-100 rounded text-yellow-700 text-center">
                                DEBUG - Dernier texte lu : <strong>{lastRawCode}</strong>
                            </div>
                        )}

                        <div className="relative min-h-[300px] flex items-center justify-center bg-gray-900 rounded-lg overflow-hidden shadow-inner">
                            {!pendingMateriel && !lastSuccessfulCode ? (
                                <BarcodeScanner
                                    key={scannerKey}
                                    onScanSuccess={handleScan}
                                />
                            ) : (
                                <div className="absolute inset-0 z-10 bg-black/70 backdrop-blur-md flex flex-col items-center justify-center text-white text-center p-6 animate-in fade-in duration-300">
                                    <div className="bg-blue-600 p-4 rounded-full mb-4 shadow-xl animate-bounce">
                                        <CheckCircle className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-xl font-black mb-1">Scan en pause</h3>
                                    <p className="text-blue-100 font-medium mb-4">
                                        {pendingMateriel
                                            ? `Vérification : ${pendingMateriel.numero_inventaire}`
                                            : "Passez à l'objet suivant"}
                                    </p>
                                    {!pendingMateriel && (
                                        <div className="w-full max-w-[150px] h-1.5 bg-white/20 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-400 animate-shrink" style={{ animationDuration: '5s' }}></div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {lastScan && !pendingMateriel && (
                            <div className={`mt-4 p-4 rounded-lg text-center font-bold flex items-center justify-center animate-in slide-in-from-top-2 ${lastScan.status === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                                {lastScan.status === 'success' ? <CheckCircle className="w-6 h-6 mr-2" /> : <AlertTriangle className="w-6 h-6 mr-2" />}
                                {lastScan.msg}
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-4 rounded-xl shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-700">Historique Campagne</h2>
                            <button
                                onClick={loadStats}
                                disabled={isLoadingHistory}
                                className="text-blue-600 hover:text-blue-800 text-sm font-bold flex items-center disabled:opacity-50"
                            >
                                <Play className={`w-3 h-3 mr-1 rotate-90 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                                Actualiser
                            </button>
                        </div>
                        <ul className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                            {scannedItems.map((item, idx) => (
                                <li key={idx} className="py-3 flex justify-between items-center group hover:bg-gray-50 px-2 rounded">
                                    <div>
                                        <span className="font-bold block text-gray-800">{item.nom}</span>
                                        <span className="text-xs text-gray-500 font-mono">{item.numero_inventaire}</span>
                                    </div>
                                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full flex items-center">
                                        <CheckCircle className="w-3 h-3 mr-1" /> OK
                                    </span>
                                </li>
                            ))}
                            {scannedItems.length === 0 && (
                                <div className="text-center py-10 text-gray-400 flex flex-col items-center">
                                    <List className="w-10 h-10 mb-2 opacity-20" />
                                    <p>Vos scans apparaîtront ici</p>
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
