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

    const handlePrint = (code: string) => {
        const url = materielService.getBarcodeUrl(code);
        const win = window.open('', '_blank');
        if (win) {
            win.document.write(`<img src="${url}" onload="window.print();" />`);
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
                                    <button onClick={() => handlePrint(m.numero_inventaire)} className="text-blue-600 hover:text-blue-900 flex items-center">
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
