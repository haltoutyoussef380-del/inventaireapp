import React, { useEffect, useState } from 'react';
import { userService } from '../services/supabaseApi';
import { UserPlus, Users, Shield, Mail, Key, UserIcon, ArrowLeft } from 'lucide-react';

const UsersPage: React.FC = () => {
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const [newUser, setNewUser] = useState({ email: '', password: '', name: '' });
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        loadAgents();
    }, []);

    const loadAgents = async () => {
        try {
            const data = await userService.getAgents();
            setAgents(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg(null);
        try {
            await userService.createAgent(newUser.email, newUser.password, newUser.name);
            setMsg({ type: 'success', text: 'Nouvel agent ajouté avec succès !' });
            setNewUser({ email: '', password: '', name: '' });
            setShowForm(false);
            loadAgents();
        } catch (error: any) {
            console.error(error);
            setMsg({ type: 'error', text: 'Échec: ' + error.message });
        }
    };

    return (
        <div className="max-w-6xl mx-auto animate-fade-in px-4">
            <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
                <div className="flex items-center gap-6">
                    <div className="bg-gst-dark p-4 rounded-3xl shadow-xl text-white">
                        <Users size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gst-dark uppercase tracking-tight">Personnel & Accès</h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mt-1">Gestion des habilitations CHU</p>
                    </div>
                </div>

                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-gst-light text-white px-8 py-4 rounded-[24px] font-black shadow-xl shadow-gst-light/10 hover:bg-gst-dark transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                    >
                        <UserPlus className="w-5 h-5" /> Ajouter un Agent
                    </button>
                )}
            </div>

            {msg && (
                <div className={`mb-8 p-6 rounded-[32px] border-2 font-black text-center animate-in slide-in-from-top duration-300 shadow-xl ${msg.type === 'success' ? 'bg-green-50 border-green-100 text-green-700 shadow-green-100' : 'bg-red-50 border-red-100 text-red-700 shadow-red-100'}`}>
                    {msg.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Form Overlay/Section */}
                {showForm && (
                    <div className="lg:col-span-5 animate-in slide-in-from-left duration-500">
                        <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-gray-100 sticky top-8">
                            <button onClick={() => setShowForm(false)} className="text-gray-400 mb-6 flex items-center hover:text-red-500 font-black transition-colors uppercase tracking-[0.2em] text-[10px]">
                                <ArrowLeft className="w-3 h-3 mr-2" /> Annuler
                            </button>
                            <h2 className="text-2xl font-black mb-8 text-gst-dark uppercase tracking-tight border-l-4 border-gst-light pl-4">Nouvel Agent</h2>

                            <form onSubmit={handleCreate} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Nom & Prénom</label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
                                        <input type="text" required
                                            className="w-full bg-slate-50 border-2 border-transparent focus:border-gst-light focus:bg-white p-5 pl-14 rounded-[28px] transition-all outline-none font-bold text-gray-700"
                                            placeholder="ex: Dr. Youssef H."
                                            value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Email Professionnel</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
                                        <input type="email" required
                                            className="w-full bg-slate-50 border-2 border-transparent focus:border-gst-light focus:bg-white p-5 pl-14 rounded-[28px] transition-all outline-none font-bold text-gray-700"
                                            placeholder="agent@chu.ma"
                                            value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Code d'accès provisoire</label>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
                                        <input type="text" required minLength={6}
                                            className="w-full bg-slate-50 border-2 border-transparent focus:border-gst-light focus:bg-white p-5 pl-14 rounded-[28px] transition-all outline-none font-bold text-gray-700"
                                            placeholder="min. 6 caractères"
                                            value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
                                    </div>
                                </div>

                                <button type="submit" className="w-full bg-gst-dark text-white py-6 rounded-[28px] font-black text-lg shadow-xl shadow-gst-dark/10 hover:bg-gst-light transition-all transform active:scale-[0.98] uppercase mt-4">
                                    Créer le Compte
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Agents List Card */}
                <div className={`${showForm ? 'lg:col-span-7' : 'lg:col-span-12'} bg-white rounded-[48px] shadow-2xl border border-gray-100 overflow-hidden min-h-[500px] flex flex-col`}>
                    <div className="p-8 border-b border-gray-50 bg-slate-50/50 flex items-center justify-between">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Base de données Agents</span>
                        <div className="flex gap-2">
                            <div className="h-2 w-2 rounded-full bg-gst-light animate-pulse"></div>
                            <div className="h-2 w-2 rounded-full bg-gst-light animate-pulse delay-100"></div>
                            <div className="h-2 w-2 rounded-full bg-gst-light animate-pulse delay-200"></div>
                        </div>
                    </div>

                    <div className="overflow-x-auto flex-1 h-[600px] custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-white sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Utilisateur</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Niveau Accès</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Signature Logicielle</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr><td colSpan={3} className="px-8 py-20 text-center font-black text-gray-200 uppercase tracking-widest animate-pulse">Synchronisation...</td></tr>
                                ) : agents.length === 0 ? (
                                    <tr><td colSpan={3} className="px-8 py-20 text-center text-gray-300 font-bold uppercase tracking-widest">Aucun personnel enregistré</td></tr>
                                ) : (
                                    agents.map(agent => (
                                        <tr key={agent.id} className="hover:bg-slate-50 group transition-all">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-12 h-12 bg-gst-dark/5 rounded-2xl flex items-center justify-center text-gst-dark font-black border border-gst-dark/10 shadow-inner group-hover:bg-gst-light group-hover:text-white transition-colors">
                                                        {agent.email.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-gst-dark tracking-tight uppercase text-sm">{agent.email}</div>
                                                        <div className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em]">Membre CHU</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="inline-flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-2xl border border-purple-100 shadow-sm shadow-purple-50">
                                                    <Shield size={12} className="text-purple-600" />
                                                    <span className="text-[10px] font-black text-purple-700 uppercase tracking-widest">
                                                        {agent.role}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <span className="text-[9px] text-gray-300 font-mono tracking-tighter opacity-50 group-hover:opacity-100 transition-opacity">#{agent.id.substring(0, 12)}...</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-8 bg-slate-50/50 text-right border-t border-gray-50">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total : {agents.length} agent(s) actif(s)</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UsersPage;
