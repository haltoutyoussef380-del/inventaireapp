import React, { useEffect, useState } from 'react';
import { userService } from '../services/supabaseApi';
import { UserPlus, Users } from 'lucide-react';

const UsersPage: React.FC = () => {
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const [newUser, setNewUser] = useState({ email: '', password: '', name: '' });
    const [msg, setMsg] = useState('');

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
        setMsg('');
        try {
            await userService.createAgent(newUser.email, newUser.password, newUser.name);
            setMsg('Agent créé avec succès !');
            setNewUser({ email: '', password: '', name: '' });
            setShowForm(false);
            loadAgents(); // Reload list
        } catch (error: any) {
            console.error(error);
            setMsg('Erreur: ' + error.message);
        }
    };

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6 flex items-center">
                <Users className="mr-2" /> Gestion des Agents
            </h1>

            {msg && <div className="bg-blue-100 p-3 rounded mb-4 text-blue-800">{msg}</div>}

            <div className="mb-6">
                {!showForm ? (
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded flex items-center hover:bg-green-700"
                    >
                        <UserPlus className="mr-2 w-4 h-4" /> Nouvel Agent
                    </button>
                ) : (
                    <div className="bg-white p-6 rounded shadow max-w-md border border-gray-200">
                        <h2 className="text-xl font-bold mb-4">Ajouter un Agent</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium">Nom complet</label>
                                <input type="text" required className="w-full border p-2 rounded"
                                    value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Email</label>
                                <input type="email" required className="w-full border p-2 rounded"
                                    value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Mot de passe provisoire</label>
                                <input type="text" required className="w-full border p-2 rounded" minLength={6}
                                    value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">
                                    Annuler
                                </button>
                                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                                    Créer le compte
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            <div className="bg-white rounded shadow overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-4 border-b">Email</th>
                            <th className="p-4 border-b">Rôle</th>
                            <th className="p-4 border-b">ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td className="p-4">Chargement...</td></tr>
                        ) : agents.length === 0 ? (
                            <tr><td className="p-4 text-gray-500">Aucun agent trouvé.</td></tr>
                        ) : (
                            agents.map(agent => (
                                <tr key={agent.id} className="hover:bg-gray-50">
                                    <td className="p-4 border-b font-medium">{agent.email}</td>
                                    <td className="p-4 border-b">
                                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-bold uppercase">
                                            {agent.role}
                                        </span>
                                    </td>
                                    <td className="p-4 border-b text-sm text-gray-400 font-mono">{agent.id}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UsersPage;
