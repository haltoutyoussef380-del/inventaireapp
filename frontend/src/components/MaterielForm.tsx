import React, { useState, useEffect } from 'react';
import { materielService, categorieService } from '../services/supabaseApi';

const MaterielForm = ({ onSuccess }: { onSuccess: () => void }) => {
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        categorie_id: '',
        nom: '',
        marque: '',
        modele: '',
        numero_serie: '',
        date_acquisition: '',
        service: '',
        statut: 'En service',
        commentaires: '',
        photo_url: ''
    });

    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        categorieService.getAll().then(data => setCategories(data as any));
    }, []);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) {
            return;
        }
        setUploading(true);
        try {
            const file = e.target.files[0];
            const publicUrl = await materielService.uploadPhoto(file);
            setFormData({ ...formData, photo_url: publicUrl });
        } catch (error) {
            console.error(error);
            alert('Erreur upload photo');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await materielService.create(formData);
            onSuccess();
            // Reset form or close modal
            setFormData({ ...formData, nom: '', numero_serie: '', photo_url: '' });
        } catch (error) {
            alert('Erreur lors de la création');
            console.error(error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium">Catégorie</label>
                    <select
                        className="w-full border p-2 rounded"
                        value={formData.categorie_id}
                        onChange={e => setFormData({ ...formData, categorie_id: e.target.value })}
                        required
                    >
                        <option value="">Sélectionner...</option>
                        {categories.map((c: any) => (
                            <option key={c.id} value={c.id}>
                                {c.libelle} ({c.code})
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium">Nom matériel</label>
                    <input type="text" className="w-full border p-2 rounded"
                        value={formData.nom} onChange={e => setFormData({ ...formData, nom: e.target.value })} required />
                </div>
                <div>
                    <label className="block text-sm font-medium">Marque</label>
                    <input type="text" className="w-full border p-2 rounded"
                        value={formData.marque} onChange={e => setFormData({ ...formData, marque: e.target.value })} />
                </div>
                <div>
                    <label className="block text-sm font-medium">Modèle</label>
                    <input type="text" className="w-full border p-2 rounded"
                        value={formData.modele} onChange={e => setFormData({ ...formData, modele: e.target.value })} />
                </div>
                <div>
                    <label className="block text-sm font-medium">Numéro Série</label>
                    <input type="text" className="w-full border p-2 rounded"
                        value={formData.numero_serie} onChange={e => setFormData({ ...formData, numero_serie: e.target.value })} />
                </div>
                <div>
                    <label className="block text-sm font-medium">Service / Emplacement</label>
                    <input type="text" className="w-full border p-2 rounded"
                        value={formData.service} onChange={e => setFormData({ ...formData, service: e.target.value })} />
                </div>
                <div>
                    <label className="block text-sm font-medium">Date d'acquisition</label>
                    <input type="date" className="w-full border p-2 rounded"
                        value={formData.date_acquisition} onChange={e => setFormData({ ...formData, date_acquisition: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium">Photo</label>
                    <div className="flex items-center space-x-4">
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment" // Forces camera on mobile
                            onChange={handleImageUpload}
                            className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100"
                            disabled={uploading}
                        />
                        {uploading && <span className="text-gray-500 text-sm">Upload en cours...</span>}
                        {formData.photo_url && (
                            <img src={formData.photo_url} alt="Aperçu" className="h-16 w-16 object-cover rounded" />
                        )}
                    </div>
                </div>
            </div>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={uploading}>
                {uploading ? 'Patientez...' : 'Enregistrer'}
            </button>
        </form>
    );
};

export default MaterielForm;
