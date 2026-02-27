import React, { useEffect, useState } from 'react';
import { materielService } from '../services/supabaseApi';
import { Package, CheckCircle, Database } from 'lucide-react';

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
        <div className="animate-fade-in">
            <h1 className="text-3xl font-black text-gst-dark mb-8 tracking-tight uppercase">Tableau de bord</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                <div className="bg-white p-8 rounded-[32px] shadow-xl border border-gray-100 flex items-center justify-between group hover:border-gst-light transition-all">
                    <div>
                        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-2">Total Matériels</h2>
                        <p className="text-5xl font-black text-gst-dark group-hover:text-gst-light transition-colors">{stats.totalMateriels}</p>
                    </div>
                    <div className="bg-gst-dark/5 p-4 rounded-2xl group-hover:bg-gst-light/10 transition-colors">
                        <Package className="w-10 h-10 text-gst-dark group-hover:text-gst-light" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[32px] shadow-xl border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-gst-light/10 p-2 rounded-xl">
                            <Database className="w-6 h-6 text-gst-light" />
                        </div>
                        <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Par Catégorie</h3>
                    </div>
                    <ul className="space-y-3">
                        {Object.entries(stats.byCategory).map(([key, val]) => (
                            <li key={key} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-200 transition-all group">
                                <span className="font-bold text-gray-600 group-hover:text-gst-dark transition-colors">{key}</span>
                                <span className="bg-white px-4 py-1 rounded-xl shadow-sm font-black text-gst-light">{val}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="bg-white p-8 rounded-[32px] shadow-xl border border-gray-100">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-gst-dark/5 p-2 rounded-xl">
                            <CheckCircle className="w-6 h-6 text-gst-dark" />
                        </div>
                        <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Par Statut</h3>
                    </div>
                    <ul className="space-y-3">
                        {Object.entries(stats.byStatus).map(([key, val]) => (
                            <li key={key} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-200 transition-all group">
                                <span className="font-bold text-gray-600 group-hover:text-gst-dark transition-colors">{key}</span>
                                <span className="bg-white px-4 py-1 rounded-xl shadow-sm font-black text-gst-dark">{val}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
