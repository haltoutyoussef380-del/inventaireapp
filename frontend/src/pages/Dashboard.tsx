import React, { useEffect, useState } from 'react';
import { materielService } from '../services/supabaseApi';

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState({
        totalMateriels: 0,
        byCategory: {} as Record<string, number>,
        byStatus: {} as Record<string, number>
    });

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const materiels = await materielService.getAll();

            const byCategory: Record<string, number> = {};
            const byStatus: Record<string, number> = {};

            materiels.forEach((m: any) => {
                const cat = m.categories?.libelle || 'Inconnu';
                byCategory[cat] = (byCategory[cat] || 0) + 1;

                const stat = m.statut || 'Inconnu';
                byStatus[stat] = (byStatus[stat] || 0) + 1;
            });

            setStats({
                totalMateriels: materiels.length,
                byCategory,
                byStatus
            });
        } catch (error) {
            console.error("Erreur chargement stats", error);
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-semibold mb-6">Tableau de bord</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl text-gray-700 font-semibold mb-2">Total Matériels</h2>
                    <p className="text-4xl font-bold text-blue-600">{stats.totalMateriels}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Par Catégorie</h3>
                    <ul>
                        {Object.entries(stats.byCategory).map(([key, val]) => (
                            <li key={key} className="flex justify-between py-2 border-b">
                                <span>{key}</span>
                                <span className="font-bold">{val}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-4">Par Statut</h3>
                    <ul>
                        {Object.entries(stats.byStatus).map(([key, val]) => (
                            <li key={key} className="flex justify-between py-2 border-b">
                                <span>{key}</span>
                                <span className="font-bold">{val}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
