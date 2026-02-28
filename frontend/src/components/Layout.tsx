import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ClipboardList, Menu, Users, Settings, LogOut } from 'lucide-react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';

const Layout: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const { role } = useAuth();
    const location = useLocation();

    const menuItems = [
        { path: '/', label: 'Tableau de bord', icon: LayoutDashboard },
        { path: '/materiels', label: 'Matériels', icon: Package },
        { path: '/inventaire', label: 'Campagne Inventaire', icon: ClipboardList },
    ];

    const adminItems = [
        { path: '/users', label: 'Agents', icon: Users },
        { path: '/printer-config', label: 'Config Imprimante', icon: Settings },
    ];

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Sidebar Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-gst-dark/60 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <aside className={`fixed z-50 inset-y-0 left-0 w-64 bg-gst-dark text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <nav className="mt-10 px-4 space-y-1 overflow-y-auto h-[calc(100vh-100px)] custom-scrollbar">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center px-4 py-3 rounded-xl transition-all group ${isActive(item.path)
                                ? 'bg-gst-light text-white shadow-lg'
                                : 'text-blue-100 hover:bg-white/10'
                                }`}
                        >
                            <item.icon className={`w-5 h-5 mr-3 ${isActive(item.path) ? 'text-white' : 'text-gst-light group-hover:text-white'}`} />
                            <span className="font-bold">{item.label}</span>
                        </Link>
                    ))}

                    {/* Admin Section */}
                    {role === 'admin' && (
                        <div className="pt-6">
                            <p className="px-4 text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Administration</p>
                            {adminItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center px-4 py-3 rounded-xl transition-all group ${isActive(item.path)
                                        ? 'bg-gst-light text-white shadow-lg'
                                        : 'text-blue-100 hover:bg-white/10'
                                        }`}
                                >
                                    <item.icon className={`w-5 h-5 mr-3 ${isActive(item.path) ? 'text-white' : 'text-gst-light group-hover:text-white'}`} />
                                    <span className="font-bold">{item.label}</span>
                                </Link>
                            ))}
                        </div>
                    )}

                    <div className="pt-8 pb-4">
                        <button
                            onClick={() => { supabase.auth.signOut(); setSidebarOpen(false); }}
                            className="flex w-full items-center px-4 py-3 text-red-300 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-colors mt-4 border border-red-500/20"
                        >
                            <LogOut className="w-5 h-5 mr-3" />
                            <span className="font-bold">Déconnexion</span>
                        </button>
                    </div>
                </nav>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Unified Header with Official GST Banner */}
                <div className="w-full bg-white border-b border-gray-200 shadow-sm relative z-30">
                    <div className="flex items-center lg:hidden absolute left-4 h-full">
                        <button onClick={() => setSidebarOpen(true)} className="p-2 text-gst-dark bg-gray-50 rounded-lg">
                            <Menu className="w-6 h-6" />
                        </button>
                    </div>
                    <img
                        src={`${import.meta.env.BASE_URL}header.png`}
                        alt="Header GST"
                        className="w-full max-h-24 md:max-h-28 object-cover md:object-contain mx-auto"
                    />
                </div>

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 md:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
