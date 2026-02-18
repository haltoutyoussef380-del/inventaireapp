import React, { useState } from 'react';
import { inventaireService } from '../services/supabaseApi';
import BarcodeScanner from '../components/BarcodeScanner';
import { Play, PlusCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const InventairePage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'create' | 'scan'>('create');
    const [inventaireId, setInventaireId] = useState<number | null>(null);
    const { user } = useAuth();

    // Formulaire Création
    const [newInv, setNewInv] = useState({ nom: '', service_perimetre: '', date_debut: new Date().toISOString().split('T')[0] });

    // État Scan
    const [scannedItems, setScannedItems] = useState<any[]>([]);
    const [lastScan, setLastScan] = useState<{ status: 'success' | 'error', msg: string, item?: any } | null>(null);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = await inventaireService.create(newInv);
            setInventaireId(data.id);
            setActiveTab('scan');
            alert(`Campagne "${data.nom}" créée !`);
        } catch (error) {
            alert('Erreur création campagne');
            console.error(error);
        }
    };

    const handleScan = async (code: string) => {
        // Éviter les doubles scans immédiats si besoin, ou gérer via backend
        if (!inventaireId || !user) return;

        try {
            const materiel = await inventaireService.scan({
                inventaire_id: inventaireId,
                code_barres: code,
                user_id: user.id
            });

            setLastScan({ status: 'success', msg: `Scanné: ${materiel.nom}`, item: materiel });
            setScannedItems(prev => [materiel, ...prev]);

            // Feedback sonore (beep)
            const audio = new Audio('/beep.mp3'); // À ajouter dans public/
            audio.play().catch(() => { });

        } catch (error: any) {
            console.error(error);
            const msg = error.message === 'Matériel non trouvé' ? 'Matériel inconnu' : 'Erreur scan';
            setLastScan({ status: 'error', msg });
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold mb-6">Campagnes d'Inventaire</h1>

            <div className="flex space-x-4 mb-6">
                <button
                    className={`px-4 py-2 rounded ${activeTab === 'create' ? 'bg-blue-600 text-white' : 'bg-white'}`}
                    onClick={() => setActiveTab('create')}
                >
                    <PlusCircle className="inline w-4 h-4 mr-2" />
                    Nouvelle Campagne
                </button>
                <button
                    className={`px-4 py-2 rounded ${activeTab === 'scan' ? 'bg-blue-600 text-white' : 'bg-white'} ${!inventaireId ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => inventaireId && setActiveTab('scan')}
                    disabled={!inventaireId}
                >
                    <Play className="inline w-4 h-4 mr-2" />
                    Mode Scan
                </button>
            </div>

            {activeTab === 'create' && (
                <div className="bg-white p-6 rounded shadow max-w-lg">
                    <h2 className="text-xl mb-4">Démarrer un nouvel inventaire</h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium">Nom de la campagne</label>
                            <input type="text" className="w-full border p-2 rounded" required
                                value={newInv.nom} onChange={e => setNewInv({ ...newInv, nom: e.target.value })}
                                placeholder="ex: Inventaire 2026 - Pôle A" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Service / Périmètre</label>
                            <input type="text" className="w-full border p-2 rounded"
                                value={newInv.service_perimetre} onChange={e => setNewInv({ ...newInv, service_perimetre: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Date Début</label>
                            <input type="date" className="w-full border p-2 rounded" required
                                value={newInv.date_debut} onChange={e => setNewInv({ ...newInv, date_debut: e.target.value })} />
                        </div>
                        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700">
                            Créer et Commencer
                        </button>
                    </form>
                </div>
            )}

            {activeTab === 'scan' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-4 rounded shadow">
                        <h2 className="text-xl mb-4 text-center font-bold">Scanner</h2>
                        <BarcodeScanner onScanSuccess={handleScan} />

                        {lastScan && (
                            <div className={`mt-4 p-4 rounded text-center font-bold ${lastScan.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {lastScan.status === 'success' ? <CheckCircle className="inline w-6 h-6 mr-2" /> : <AlertTriangle className="inline w-6 h-6 mr-2" />}
                                {lastScan.msg}
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-4 rounded shadow">
                        <h2 className="text-xl mb-4">Derniers articles scannés</h2>
                        <ul className="divide-y divide-gray-200">
                            {scannedItems.map((item, idx) => (
                                <li key={idx} className="py-2 flex justify-between">
                                    <div>
                                        <span className="font-bold block">{item.nom}</span>
                                        <span className="text-sm text-gray-500">{item.numero_inventaire}</span>
                                    </div>
                                    <span className="text-green-600 font-bold">OK</span>
                                </li>
                            ))}
                            {scannedItems.length === 0 && <p className="text-gray-500 italic">Aucun scan pour le moment.</p>}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventairePage;
