import React, { useState } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ChevronRight } from 'lucide-react';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            alert(error.message);
        } else {
            navigate('/');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden font-sans">
            {/* Decoration Circles */}
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-gst-light/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-gst-dark/5 rounded-full blur-3xl"></div>

            <div className="w-full max-w-md px-6 z-10 animate-in fade-in zoom-in duration-500">
                <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-100">
                    {/* Header Image */}
                    <div className="bg-gst-dark p-10 flex flex-col items-center">
                        <div className="bg-white p-4 rounded-3xl shadow-lg mb-6 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Logo" className="w-24 h-24 object-contain" />
                        </div>
                        <h1 className="text-white text-2xl font-black text-center leading-tight tracking-tight uppercase">
                            Gestion d'Inventaire
                        </h1>
                        <p className="text-blue-200 text-xs font-bold mt-2 uppercase tracking-widest">
                            L'Hôpital Universitaire Psychiatrique Mohammed VI
                        </p>
                    </div>

                    <div className="p-10">
                        <h2 className="text-xl font-bold text-gray-800 mb-8 border-l-4 border-gst-light pl-4">Connexion</h2>

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-2">Email Professionnel</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
                                    <input
                                        type="email"
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-gst-light focus:bg-white p-4 pl-12 rounded-2xl transition-all outline-none font-bold text-gray-700"
                                        placeholder="votre@gst.ma"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest pl-2">Mot de passe</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
                                    <input
                                        type="password"
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-gst-light focus:bg-white p-4 pl-12 rounded-2xl transition-all outline-none font-bold text-gray-700"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="group w-full bg-gst-dark text-white p-5 rounded-3xl font-black text-lg shadow-xl shadow-gst-dark/20 hover:bg-gst-light transition-all transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center"
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-6 w-6 border-4 border-white border-t-transparent"></div>
                                ) : (
                                    <>
                                        Se connecter
                                        <ChevronRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    <div className="bg-gray-50 p-6 border-t border-gray-100 flex flex-col items-center gap-4">
                        <a
                            href={`${import.meta.env.BASE_URL}inventaire-gst.apk`}
                            download
                            className="flex items-center gap-2 text-[11px] font-black text-gst-light hover:text-gst-dark transition-colors uppercase tracking-widest bg-white px-4 py-2 rounded-full border border-gst-light/20 shadow-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Télécharger l'application Mobile (.APK)
                        </a>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                            Sécurisé par GST • 2026
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
