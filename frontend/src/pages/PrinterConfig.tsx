import React, { useState, useEffect } from 'react';
import { Settings, Printer, Save, RefreshCw, Sliders } from 'lucide-react';

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
        <div className="max-w-6xl mx-auto animate-fade-in">
            <div className="flex items-center gap-6 mb-10">
                <div className="bg-gst-dark p-4 rounded-3xl text-white shadow-xl">
                    <Printer size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-gst-dark tracking-tight uppercase">Configuration Etiquettes</h1>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-1">Calibrage Précision Laser</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Form Section */}
                <div className="lg:col-span-5 bg-white p-10 rounded-[40px] shadow-2xl border border-gray-100 flex flex-col">
                    <h2 className="text-xl font-black mb-8 flex items-center gap-3 text-gst-dark uppercase tracking-tight border-l-4 border-gst-light pl-4">
                        <Sliders size={20} className="text-gst-light" />
                        Réglages Support
                    </h2>

                    <div className="mb-10">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Formats standards</label>
                        <div className="flex flex-wrap gap-2">
                            {PRESETS.map((p, i) => (
                                <button
                                    key={i}
                                    onClick={() => applyPreset(p)}
                                    className="px-5 py-3 bg-slate-50 hover:bg-gst-light hover:text-white text-gray-600 text-[10px] font-black uppercase tracking-tighter rounded-2xl border border-gray-100 transition-all hover:shadow-lg shadow-gst-light/10"
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-8 flex-1">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Largeur (mm)</label>
                                <input
                                    type="number"
                                    name="width"
                                    value={settings.width}
                                    onChange={handleChange}
                                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-gst-light focus:bg-white rounded-[24px] transition-all font-black text-gst-dark outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Hauteur (mm)</label>
                                <input
                                    type="number"
                                    name="height"
                                    value={settings.height}
                                    onChange={handleChange}
                                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-gst-light focus:bg-white rounded-[24px] transition-all font-black text-gst-dark outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Marge Gauche</label>
                                <input
                                    type="number"
                                    name="marginLeft"
                                    value={settings.marginLeft}
                                    onChange={handleChange}
                                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-gst-light focus:bg-white rounded-[24px] transition-all font-black text-gst-dark outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Marge Haute</label>
                                <input
                                    type="number"
                                    name="marginTop"
                                    value={settings.marginTop}
                                    onChange={handleChange}
                                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-gst-light focus:bg-white rounded-[24px] transition-all font-black text-gst-dark outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 pb-4">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Taille Texte</label>
                                <input
                                    type="number"
                                    name="fontSize"
                                    value={settings.fontSize}
                                    onChange={handleChange}
                                    className="w-full px-4 py-4 bg-slate-50 border-2 border-transparent focus:border-gst-light focus:bg-white rounded-[20px] transition-all font-black text-gst-dark outline-none text-center"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Taille Logo</label>
                                <input
                                    type="number"
                                    name="logoWidth"
                                    value={settings.logoWidth}
                                    onChange={handleChange}
                                    className="w-full px-4 py-4 bg-slate-50 border-2 border-transparent focus:border-gst-light focus:bg-white rounded-[20px] transition-all font-black text-gst-dark outline-none text-center"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gst-light uppercase tracking-widest text-center">Taille QR</label>
                                <input
                                    type="number"
                                    name="qrSize"
                                    value={settings.qrSize}
                                    onChange={handleChange}
                                    className="w-full px-4 py-4 bg-gst-light/5 border-2 border-gst-light/20 focus:border-gst-light focus:bg-white rounded-[20px] transition-all font-black text-gst-light outline-none text-center"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-6">
                            <button
                                onClick={handleSave}
                                className={`flex-1 py-6 rounded-[24px] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-2xl ${saved ? 'bg-green-600 text-white shadow-green-200' : 'bg-gst-dark text-white hover:bg-gst-light shadow-gst-dark/20'}`}
                            >
                                <Save size={18} />
                                {saved ? 'Réussite !' : 'Appliquer'}
                            </button>
                            <button
                                onClick={handleReset}
                                className="px-6 py-4 bg-slate-50 border-2 border-transparent text-gray-300 rounded-[24px] hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center shadow-inner"
                                title="Réinitialiser"
                            >
                                <RefreshCw size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Preview Section */}
                <div className="lg:col-span-7 flex flex-col gap-8">
                    <div className="flex items-center justify-between px-4">
                        <h3 className="text-gray-400 font-black uppercase tracking-[0.2em] text-[10px]">Simulation Impression Réelle</h3>
                        <span className="bg-gst-light/10 text-gst-light text-[10px] font-black px-3 py-1 rounded-full border border-gst-light/20 uppercase tracking-widest shadow-sm shadow-gst-light/5">Echelle 1:1</span>
                    </div>

                    <div className="bg-white p-16 rounded-[60px] flex items-center justify-center min-h-[500px] shadow-3xl border-8 border-slate-50 ring-1 ring-gray-100 relative overflow-hidden">
                        {/* Blueprint Grid Background */}
                        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#1B365D 1px, transparent 1px)', backgroundSize: '15px 15px' }}></div>

                        <div
                            style={{
                                width: `${settings.width}mm`,
                                height: `${settings.height}mm`,
                                transform: `translate(${settings.marginLeft}mm, ${settings.marginTop}mm)`,
                                backgroundColor: 'white',
                                boxShadow: '0 30px 60px rgba(0,0,0,0.12), 0 0 1px rgba(0,0,0,0.2)',
                                border: '1px solid #111',
                                display: 'flex',
                                flexDirection: 'column',
                                padding: '1.2mm 2.2mm',
                                boxSizing: 'border-box',
                                overflow: 'hidden',
                                transition: 'all 0.5s cubic-bezier(0.19, 1, 0.22, 1)',
                                position: 'relative',
                                zIndex: 10
                            }}
                        >
                            <div className="mb-2 border-b-2 border-black pb-1">
                                <span style={{ fontSize: `${settings.fontSize}pt` }} className="font-black truncate uppercase block leading-none tracking-tight">NOM MATERIEL GST</span>
                                <span style={{ fontSize: `${settings.fontSize * 0.75}pt` }} className="text-gray-600 block truncate font-black mt-0.5 uppercase tracking-tighter">HP ELITEDESK 800 IP: 10.0.0.1</span>
                            </div>
                            <div className="flex-1 flex items-center justify-between w-full">
                                <div className="flex flex-col items-center justify-center" style={{ width: '45%' }}>
                                    <div
                                        style={{ width: `${settings.qrSize}mm`, height: `${settings.qrSize}mm` }}
                                        className="bg-black flex items-center justify-center mb-1 shadow-sm transition-all"
                                    >
                                        <div className="grid grid-cols-5 gap-0.5 p-1 w-full h-full">
                                            {[...Array(25)].map((_, i) => (
                                                <div key={i} className={`bg-white ${Math.random() > 0.4 ? 'opacity-100' : 'opacity-0'}`}></div>
                                            ))}
                                        </div>
                                    </div>
                                    <span style={{ fontSize: `${settings.fontSize * 0.6}pt` }} className="font-mono font-black text-black uppercase tracking-widest mt-0.5">INV-26-001</span>
                                </div>
                                <div className="flex justify-center items-center" style={{ width: '50%' }}>
                                    <div
                                        className="bg-gst-dark/5 p-2 rounded-xl flex flex-col items-center justify-center border border-gst-dark/10 shadow-inner"
                                        style={{ width: `${settings.logoWidth}mm`, height: `${settings.height * 0.65}mm` }}
                                    >
                                        <div className="w-full h-full bg-contain bg-center bg-no-repeat opacity-50 contrast-125 grayscale" style={{ backgroundImage: `url("${import.meta.env.BASE_URL}logo-2.jfif")` }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gst-dark p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="flex items-start gap-4 relative z-10">
                            <div className="bg-gst-light p-3 rounded-2xl shadow-lg">
                                <Settings size={20} className="text-white animate-spin-slow" />
                            </div>
                            <div>
                                <h4 className="font-black text-lg uppercase tracking-tight mb-2">Guide d'étalonnage</h4>
                                <p className="text-blue-100 text-xs font-medium leading-relaxed opacity-80 uppercase tracking-wider">
                                    L'aperçu utilise des millimètres réels. <br />
                                    1. Réglez l'échelle navigateur à **100%**. <br />
                                    2. Testez sur papier avant d'utiliser vos rouleaux. <br />
                                    3. Si le QR sort du cadre, réduisez "Taille QR".
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrinterConfig;
