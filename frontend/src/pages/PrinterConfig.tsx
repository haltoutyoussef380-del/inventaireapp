import React, { useState, useEffect } from 'react';
import { Settings, Printer, Save, RefreshCw } from 'lucide-react';

interface PrinterSettings {
    width: number;
    height: number;
    marginLeft: number;
    marginTop: number;
    fontSize: number;
    logoWidth: number;
}

const DEFAULT_SETTINGS: PrinterSettings = {
    width: 50,
    height: 25,
    marginLeft: 0,
    marginTop: 0,
    fontSize: 9,
    logoWidth: 22
};

const PRESETS = [
    { label: "Standard (114x25mm)", width: 114, height: 25, fontSize: 10, logoWidth: 35 },
    { label: "Petit (50x25mm)", width: 50, height: 25, fontSize: 8, logoWidth: 22 },
    { label: "Moyen (70x30mm)", width: 70, height: 30, fontSize: 9, logoWidth: 28 },
];

const PrinterConfig: React.FC = () => {
    const [settings, setSettings] = useState<PrinterSettings>(DEFAULT_SETTINGS);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('zebra_printer_settings');
        if (stored) {
            try {
                setSettings(JSON.parse(stored));
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
            logoWidth: preset.logoWidth
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
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex items-center gap-3 mb-8">
                <div className="bg-purple-100 p-3 rounded-xl text-purple-600">
                    <Printer size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 font-outfit">Configuration Imprimante Zebra</h1>
                    <p className="text-gray-500">Ajustez les dimensions pour vos rouleaux d'étiquettes</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Form Section */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                        <Settings size={20} className="text-gray-400" />
                        Paramètres du Support
                    </h2>

                    <div className="mb-6">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Pré-réglages rapides</label>
                        <div className="flex flex-wrap gap-2">
                            {PRESETS.map((p, i) => (
                                <button
                                    key={i}
                                    onClick={() => applyPreset(p)}
                                    className="px-3 py-1.5 bg-gray-50 hover:bg-purple-50 hover:text-purple-600 text-gray-600 text-xs font-semibold rounded-lg border border-gray-200 transition-colors"
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Largeur (mm)</label>
                                <input
                                    type="number"
                                    name="width"
                                    value={settings.width}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Hauteur (mm)</label>
                                <input
                                    type="number"
                                    name="height"
                                    value={settings.height}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Marge Gauche (mm)</label>
                                <input
                                    type="number"
                                    name="marginLeft"
                                    value={settings.marginLeft}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Marge Haute (mm)</label>
                                <input
                                    type="number"
                                    name="marginTop"
                                    value={settings.marginTop}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Taille Police (pt)</label>
                                <input
                                    type="number"
                                    name="fontSize"
                                    value={settings.fontSize}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Largeur Logo (mm)</label>
                                <input
                                    type="number"
                                    name="logoWidth"
                                    value={settings.logoWidth}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                onClick={handleSave}
                                className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${saved ? 'bg-green-500 text-white' : 'bg-purple-600 text-white hover:bg-purple-700'
                                    } shadow-lg shadow-purple-200`}
                            >
                                <Save size={20} />
                                {saved ? 'Enregistré !' : 'Enregistrer'}
                            </button>
                            <button
                                onClick={handleReset}
                                className="px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all font-medium flex items-center gap-2"
                                title="Réinitialiser"
                            >
                                <RefreshCw size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Preview Section */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-gray-500 font-medium px-2 flex items-center gap-2">
                        Aperçu visuel (Échelle 1:1)
                    </h3>
                    <div className="bg-checkered p-10 rounded-2xl flex items-center justify-center min-h-[300px] bg-slate-100/50 border-2 border-dashed border-slate-200">
                        <div
                            style={{
                                width: `${settings.width}mm`,
                                height: `${settings.height}mm`,
                                marginLeft: `${settings.marginLeft}mm`,
                                marginTop: `${settings.marginTop}mm`,
                                backgroundColor: 'white',
                                boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1)',
                                border: '1px solid #ddd',
                                display: 'flex',
                                flexDirection: 'column',
                                padding: '1mm',
                                overflow: 'hidden'
                            }}
                            className="relative"
                        >
                            <div className="w-full text-left mb-1">
                                <span style={{ fontSize: `${settings.fontSize}pt` }} className="font-bold truncate uppercase block">NOM DU MATÉRIEL</span>
                                <span className="text-[6pt] text-gray-500 block">DESCRIPTION OU CATÉGORIE</span>
                            </div>
                            <div className="flex-1 flex items-center justify-center gap-1 w-full">
                                <div className="flex flex-col items-center">
                                    <div className="w-[15mm] h-[15mm] bg-black bg-opacity-5 flex items-center justify-center mb-1 border border-dashed border-gray-300">
                                        <div className="grid grid-cols-3 gap-0.5 p-1 w-full h-full opacity-20">
                                            <div className="bg-black"></div><div className="bg-black"></div><div className="bg-black"></div>
                                            <div className="bg-black"></div><div className="border border-black"></div><div className="bg-black"></div>
                                            <div className="bg-black"></div><div className="bg-black"></div><div className="bg-black"></div>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: `${settings.fontSize - 2}pt` }} className="font-mono font-bold leading-none">INV-2026-0001</span>
                                </div>
                                <div style={{ width: `${settings.logoWidth}mm` }} className="flex justify-center items-center h-[15mm]">
                                    <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
                                        <span className="text-[6pt] text-gray-400">LOGO</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl text-yellow-800 text-sm">
                        <strong>Note :</strong> L'aperçu ci-dessus est estimé. Lors de l'impression réelle, assurez-vous que les paramètres d'échelle du navigateur sont réglés sur "100%" ou "Par défaut".
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrinterConfig;
