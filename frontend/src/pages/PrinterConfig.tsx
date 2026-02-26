import React, { useState, useEffect } from 'react';
import { Settings, Printer, Save, RefreshCw } from 'lucide-react';

interface PrinterSettings {
    width: number;
    height: number;
    marginLeft: number;
    marginTop: number;
    fontSize: number;
    logoWidth: number;
    qrSize: number;
}

const DEFAULT_SETTINGS: PrinterSettings = {
    width: 50,
    height: 25,
    marginLeft: 0,
    marginTop: 0,
    fontSize: 9,
    logoWidth: 22,
    qrSize: 18
};

const PRESETS = [
    { label: "Standard (114x25mm)", width: 114, height: 25, fontSize: 10, logoWidth: 35, qrSize: 20 },
    { label: "Petit (50x25mm)", width: 50, height: 25, fontSize: 8, logoWidth: 22, qrSize: 18 },
    { label: "Moyen (70x30mm)", width: 70, height: 30, fontSize: 9, logoWidth: 28, qrSize: 22 },
];

const PrinterConfig: React.FC = () => {
    const [settings, setSettings] = useState<PrinterSettings>(DEFAULT_SETTINGS);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('zebra_printer_settings');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // Migrer vers la nouvelle version si qrSize manque
                if (!parsed.qrSize) parsed.qrSize = 18;
                setSettings(parsed);
            } catch (e) {
                console.error("Failed to parse printer settings", e);
            }
        }
    }, []);

    const applyPreset = (preset: any) => {
        setSettings(prev => ({
            ...prev,
            width: preset.width,
            height: preset.height,
            fontSize: preset.fontSize,
            logoWidth: preset.logoWidth,
            qrSize: preset.qrSize || 18
        }));
        setSaved(false);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: parseFloat(value) || 0
        }));
        setSaved(false);
    };

    const handleSave = () => {
        localStorage.setItem('zebra_printer_settings', JSON.stringify(settings));
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const handleReset = () => {
        if (window.confirm("Réinitialiser aux valeurs par défaut ?")) {
            setSettings(DEFAULT_SETTINGS);
            setSaved(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-8">
                <div className="bg-purple-100 p-3 rounded-xl text-purple-600">
                    <Printer size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 font-outfit">Configuration Imprimante</h1>
                    <p className="text-gray-500 font-medium">Ajustez les dimensions pour vos rouleaux d'étiquettes</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Form Section */}
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-50">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800 border-l-4 border-purple-500 pl-4">
                        <Settings size={20} className="text-purple-400" />
                        Paramètres du Support
                    </h2>

                    <div className="mb-8">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Pré-réglages rapides</label>
                        <div className="flex flex-wrap gap-2 text-wrap">
                            {PRESETS.map((p, i) => (
                                <button
                                    key={i}
                                    onClick={() => applyPreset(p)}
                                    className="px-4 py-2 bg-gray-50 hover:bg-purple-600 hover:text-white text-gray-600 text-[10px] font-black uppercase tracking-tighter rounded-xl border border-gray-100 transition-all hover:shadow-lg hover:shadow-purple-100"
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Largeur (mm)</label>
                                <input
                                    type="number"
                                    name="width"
                                    value={settings.width}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50/50 border-2 border-gray-100 rounded-2xl focus:border-purple-500 focus:outline-none transition-all font-bold text-gray-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Hauteur (mm)</label>
                                <input
                                    type="number"
                                    name="height"
                                    value={settings.height}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50/50 border-2 border-gray-100 rounded-2xl focus:border-purple-500 focus:outline-none transition-all font-bold text-gray-700"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Marge Gauche (mm)</label>
                                <input
                                    type="number"
                                    name="marginLeft"
                                    value={settings.marginLeft}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50/50 border-2 border-gray-100 rounded-2xl focus:border-purple-500 focus:outline-none transition-all font-bold text-gray-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Marge Haute (mm)</label>
                                <input
                                    type="number"
                                    name="marginTop"
                                    value={settings.marginTop}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50/50 border-2 border-gray-100 rounded-2xl focus:border-purple-500 focus:outline-none transition-all font-bold text-gray-700"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Police (pt)</label>
                                <input
                                    type="number"
                                    name="fontSize"
                                    value={settings.fontSize}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50/50 border-2 border-gray-100 rounded-2xl focus:border-purple-500 focus:outline-none transition-all font-bold text-gray-700 text-center"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Logo (mm)</label>
                                <input
                                    type="number"
                                    name="logoWidth"
                                    value={settings.logoWidth}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50/50 border-2 border-gray-100 rounded-2xl focus:border-purple-500 focus:outline-none transition-all font-bold text-gray-700 text-center"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-purple-600 uppercase tracking-widest ml-1">Taille QR (mm)</label>
                                <input
                                    type="number"
                                    name="qrSize"
                                    value={settings.qrSize}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-purple-50/50 border-2 border-purple-100 rounded-2xl focus:border-purple-500 focus:outline-none transition-all font-black text-purple-700 text-center"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-6">
                            <button
                                onClick={handleSave}
                                className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all transform active:scale-95 shadow-xl ${saved ? 'bg-green-500 text-white shadow-green-100' : 'bg-purple-600 text-white hover:bg-purple-700 shadow-purple-100'
                                    }`}
                            >
                                <Save size={20} />
                                {saved ? 'Enregistré !' : 'Sauvegarder'}
                            </button>
                            <button
                                onClick={handleReset}
                                className="px-6 py-4 bg-white border-2 border-gray-100 text-gray-400 rounded-2xl hover:bg-gray-50 transition-all transform active:scale-95 flex items-center justify-center"
                                title="Réinitialiser"
                            >
                                <RefreshCw size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Preview Section */}
                <div className="flex flex-col gap-6">
                    <h3 className="text-gray-800 font-bold px-2 flex items-center gap-2 uppercase tracking-widest text-xs">
                        Aperçu visuel (Échelle 1:1)
                    </h3>
                    <div className="bg-checkered p-12 rounded-[40px] flex items-center justify-center min-h-[400px] bg-slate-50 border-4 border-white shadow-inner relative overflow-hidden">
                        {/* Shadow to simulate height */}
                        <div
                            style={{
                                width: `${settings.width}mm`,
                                height: `${settings.height}mm`,
                                transform: `translate(${settings.marginLeft}mm, ${settings.marginTop}mm)`,
                                backgroundColor: 'white',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                                border: '1px solid #eee',
                                display: 'flex',
                                flexDirection: 'column',
                                padding: '1mm 2mm',
                                boxSizing: 'border-box',
                                overflow: 'hidden',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                            className="relative"
                        >
                            <div className="mb-2 border-b border-black pb-0.5">
                                <span style={{ fontSize: `${settings.fontSize}pt` }} className="font-bold truncate uppercase block leading-none">NOM DU MATÉRIEL</span>
                                <span style={{ fontSize: `${settings.fontSize * 0.8}pt` }} className="text-gray-500 block truncate font-medium">MODÈLE - MARQUE</span>
                            </div>
                            <div className="flex-1 flex items-center justify-between w-full">
                                <div className="flex flex-col items-center justify-center" style={{ width: '45%' }}>
                                    <div
                                        style={{ width: `${settings.qrSize}mm`, height: `${settings.qrSize}mm` }}
                                        className="bg-black/5 flex items-center justify-center mb-1 border border-dashed border-purple-200 transition-all"
                                    >
                                        <div className="grid grid-cols-4 gap-0.5 p-1 w-full h-full opacity-30">
                                            {[...Array(16)].map((_, i) => (
                                                <div key={i} className={`bg-black ${Math.random() > 0.5 ? 'opacity-100' : 'opacity-0'}`}></div>
                                            ))}
                                        </div>
                                    </div>
                                    <span style={{ fontSize: `${settings.fontSize * 0.7}pt` }} className="font-mono font-black text-gray-400">ID-2026-X</span>
                                </div>
                                <div className="flex justify-center items-center" style={{ width: '45%' }}>
                                    <div
                                        style={{ width: `${settings.logoWidth}mm`, height: `${settings.height * 0.6}mm` }}
                                        className="bg-gray-100/50 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-200/50 transition-all"
                                    >
                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">LOGO</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-amber-50 border-2 border-amber-100 p-6 rounded-3xl text-amber-800 text-sm shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="bg-amber-100 p-1.5 rounded-lg text-amber-600 mt-0.5">
                                <Settings size={16} />
                            </div>
                            <div>
                                <strong className="block mb-1 font-bold">Conseil d'impression :</strong>
                                L'aperçu est une estimation. Si le QR dépasse de l'étiquette, réduisez la "Taille QR".
                                Assurez-vous que l'échelle d'impression du navigateur est fixée à **100%**.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrinterConfig;
