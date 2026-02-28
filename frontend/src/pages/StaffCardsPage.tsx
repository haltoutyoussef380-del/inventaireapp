import React, { useEffect, useState } from 'react';
import { staffService, userService } from '../services/supabaseApi';
import { UserPlus, Contact, Camera, X, Trash2, Search, ArrowLeft } from 'lucide-react';
import StaffIDCard from '../components/StaffIDCard';

const StaffCardsPage: React.FC = () => {
    const [staff, setStaff] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [newMember, setNewMember] = useState({ full_name: '', matricule: '', fonction: '', cnie: '' });
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [editingMember, setEditingMember] = useState<any>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadStaff();
    }, []);

    const loadStaff = async () => {
        try {
            const data = await staffService.getAll();
            setStaff(data || []);
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
            await staffService.create(newMember);
            setMsg({ type: 'success', text: 'Membre ajouté au personnel !' });
            setNewMember({ full_name: '', matricule: '', fonction: '', cnie: '' });
            setShowForm(false);
            loadStaff();
        } catch (error: any) {
            setMsg({ type: 'error', text: 'Échec: ' + error.message });
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMember) return;
        try {
            await staffService.update(editingMember.id, {
                full_name: editingMember.full_name,
                matricule: editingMember.matricule,
                fonction: editingMember.fonction,
                cnie: editingMember.cnie
            });
            setMsg({ type: 'success', text: 'Informations mises à jour !' });
            setEditingMember(null);
            loadStaff();
        } catch (error: any) {
            setMsg({ type: 'error', text: error.message });
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Supprimer ${name} de la liste du personnel ?`)) return;
        try {
            await staffService.delete(id);
            loadStaff();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editingMember) return;
        setUploading(true);
        try {
            const photoUrl = await userService.uploadUserPhoto(editingMember.id, file);
            await staffService.update(editingMember.id, { photo_url: photoUrl });
            loadStaff();
            setEditingMember((prev: any) => ({ ...prev, photo_url: photoUrl }));
        } catch (error: any) {
            alert("Erreur upload: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const filteredStaff = staff.filter(m =>
        m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.matricule?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto animate-fade-in px-4">
            <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
                <div className="flex items-center gap-6">
                    <div className="bg-gst-dark p-4 rounded-3xl shadow-xl text-white">
                        <Contact size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gst-dark uppercase tracking-tight italic">Cartes Professionnelles</h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mt-1">Gestion du personnel hospitalier</p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-gst-light w-4 h-4 transition-colors" />
                        <input
                            type="text"
                            placeholder="Rechercher un membre..."
                            className="bg-white border-2 border-gray-100 focus:border-gst-light rounded-2xl py-3 pl-12 pr-6 outline-none font-bold text-xs w-64 transition-all"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {!showForm && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-gst-light text-white px-8 py-4 rounded-[24px] font-black shadow-xl shadow-gst-light/10 hover:bg-gst-dark transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                        >
                            <UserPlus className="w-5 h-5" /> Nouveau Personnel
                        </button>
                    )}
                </div>
            </div>

            {msg && (
                <div className={`mb-8 p-6 rounded-[32px] border-2 font-black text-center animate-in slide-in-from-top duration-300 shadow-xl ${msg.type === 'success' ? 'bg-green-50 border-green-100 text-green-700 shadow-green-100' : 'bg-red-50 border-red-100 text-red-700 shadow-red-100'}`}>
                    {msg.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {showForm && (
                    <div className="lg:col-span-5 animate-in slide-in-from-left duration-500">
                        <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-gray-100 sticky top-8">
                            <button onClick={() => setShowForm(false)} className="text-gray-400 mb-6 flex items-center hover:text-red-500 font-black transition-colors uppercase tracking-[0.2em] text-[10px]">
                                <ArrowLeft className="w-3 h-3 mr-2" /> Annuler
                            </button>
                            <h2 className="text-2xl font-black mb-8 text-gst-dark uppercase tracking-tight border-l-4 border-gst-light pl-4">Ajout Personnel</h2>

                            <form onSubmit={handleCreate} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Nom Complet</label>
                                    <input type="text" required
                                        className="w-full bg-slate-50 border-2 border-transparent focus:border-gst-light focus:bg-white p-5 rounded-[28px] transition-all outline-none font-bold text-gray-700"
                                        placeholder="ex: Ahmed Mansouri"
                                        value={newMember.full_name} onChange={e => setNewMember({ ...newMember, full_name: e.target.value })} />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Matricule</label>
                                    <input type="text"
                                        className="w-full bg-slate-50 border-2 border-transparent focus:border-gst-light focus:bg-white p-5 rounded-[28px] transition-all outline-none font-bold text-gray-700"
                                        placeholder="ex: GST-2026-X"
                                        value={newMember.matricule} onChange={e => setNewMember({ ...newMember, matricule: e.target.value })} />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">CNIE</label>
                                    <input type="text"
                                        className="w-full bg-slate-50 border-2 border-transparent focus:border-gst-light focus:bg-white p-5 rounded-[28px] transition-all outline-none font-bold text-gray-700"
                                        placeholder="ex: AB123456"
                                        value={newMember.cnie} onChange={e => setNewMember({ ...newMember, cnie: e.target.value })} />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Fonction</label>
                                    <input type="text"
                                        className="w-full bg-slate-50 border-2 border-transparent focus:border-gst-light focus:bg-white p-5 rounded-[28px] transition-all outline-none font-bold text-gray-700"
                                        placeholder="ex: Infirmier Chef"
                                        value={newMember.fonction} onChange={e => setNewMember({ ...newMember, fonction: e.target.value })} />
                                </div>

                                <button type="submit" className="w-full bg-gst-dark text-white py-6 rounded-[28px] font-black text-lg shadow-xl shadow-gst-dark/10 hover:bg-gst-light transition-all transform active:scale-[0.98] uppercase mt-4">
                                    Enregistrer
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                <div className={`${showForm ? 'lg:col-span-7' : 'lg:col-span-12'} grid grid-cols-1 md:grid-cols-2 ${showForm ? 'xl:grid-cols-2' : 'xl:grid-cols-3'} gap-6`}>
                    {loading ? (
                        <div className="col-span-full py-20 text-center font-black text-gray-200 uppercase tracking-widest animate-pulse">Chargement de la base...</div>
                    ) : filteredStaff.length === 0 ? (
                        <div className="col-span-full py-20 text-center text-gray-300 font-bold uppercase tracking-widest bg-white rounded-[40px] border-2 border-dashed border-gray-100">Aucun personnel trouvé</div>
                    ) : (
                        filteredStaff.map(member => (
                            <div key={member.id} className="bg-white p-6 rounded-[40px] shadow-xl border border-gray-50 flex flex-col items-center group hover:border-gst-light transition-all">
                                <div className="relative mb-6">
                                    <div className="w-24 h-32 bg-slate-100 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-inner flex items-center justify-center">
                                        {member.photo_url ? (
                                            <img src={member.photo_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-gray-300 font-black text-[10px] uppercase text-center p-4 italic">Pas de Photo</div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setEditingMember(member)}
                                        className="absolute -bottom-2 -right-2 bg-white text-gst-dark p-2 rounded-xl shadow-lg border border-gray-100 hover:bg-gst-light hover:text-white transition-all transform hover:scale-110"
                                    >
                                        <Camera size={14} />
                                    </button>
                                </div>

                                <div className="text-center mb-6">
                                    <h3 className="font-black text-gst-dark uppercase tracking-tight line-clamp-1">{member.full_name}</h3>
                                    <p className="text-[10px] font-black text-gst-light uppercase tracking-widest mt-1 italic">{member.fonction || 'Membre du Personnel'}</p>
                                    <p className="text-[9px] font-bold text-gray-400 mt-1">{member.matricule || 'Sans matricule'}</p>
                                </div>

                                <div className="flex gap-2 w-full mt-auto">
                                    <StaffIDCard agent={{
                                        ...member,
                                        email: member.full_name.replace(' ', '.').toLowerCase() + '@gst.local'
                                    }} />
                                    <button
                                        onClick={() => handleDelete(member.id, member.full_name)}
                                        className="p-3 text-red-400 hover:bg-red-50 rounded-xl transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Edit Modal (Photo & Bio) */}
            {editingMember && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gst-dark/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-[40px] shadow-2xl p-8 relative overflow-hidden">
                        <button onClick={() => setEditingMember(null)} className="absolute top-6 right-6 text-gray-300 hover:text-red-500 transition-colors">
                            <X size={24} />
                        </button>

                        <h3 className="text-xl font-black text-gst-dark mb-6 uppercase tracking-tight">Dossier Personnel</h3>

                        <div className="flex flex-col items-center mb-10">
                            <div className="relative group">
                                <div className="w-28 h-40 bg-slate-100 rounded-2xl overflow-hidden border-4 border-slate-50 shadow-xl flex items-center justify-center">
                                    {editingMember.photo_url ? (
                                        <img src={editingMember.photo_url} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-gray-300 font-black text-xs uppercase text-center p-4 italic">Zone Photo</div>
                                    )}
                                    {uploading && <div className="absolute inset-0 bg-white/60 flex items-center justify-center"><div className="w-8 h-8 border-4 border-gst-light border-t-transparent rounded-full animate-spin"></div></div>}
                                </div>
                                <label className="absolute -bottom-3 -right-3 bg-gst-light text-white p-4 rounded-2xl shadow-2xl cursor-pointer hover:bg-gst-dark transition-all transform hover:scale-105 active:scale-95 shadow-gst-light/30">
                                    <Camera size={20} />
                                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                                </label>
                            </div>
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Nom Complet</label>
                                <input type="text" className="w-full bg-slate-50 p-4 rounded-2xl font-bold text-gray-700 outline-none focus:bg-white border-2 border-transparent focus:border-gst-light transition-all"
                                    value={editingMember.full_name} onChange={e => setEditingMember({ ...editingMember, full_name: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Matricule</label>
                                <input type="text" className="w-full bg-slate-50 p-4 rounded-2xl font-bold text-gray-700 outline-none focus:bg-white border-2 border-transparent focus:border-gst-light transition-all"
                                    value={editingMember.matricule || ''} onChange={e => setEditingMember({ ...editingMember, matricule: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">CNIE</label>
                                <input type="text" className="w-full bg-slate-50 p-4 rounded-2xl font-bold text-gray-700 outline-none focus:bg-white border-2 border-transparent focus:border-gst-light transition-all"
                                    value={editingMember.cnie || ''} onChange={e => setEditingMember({ ...editingMember, cnie: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Fonction</label>
                                <input type="text" className="w-full bg-slate-50 p-4 rounded-2xl font-bold text-gray-700 outline-none focus:bg-white border-2 border-transparent focus:border-gst-light transition-all"
                                    value={editingMember.fonction || ''} onChange={e => setEditingMember({ ...editingMember, fonction: e.target.value })} />
                            </div>
                            <button className="w-full bg-gst-dark text-white py-5 rounded-3xl font-black mt-4 hover:bg-gst-light transition-all shadow-xl shadow-gst-dark/10 uppercase tracking-widest text-xs">
                                Enregistrer
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffCardsPage;
