import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { LayoutDashboard, Package, ClipboardList, Menu, Users } from 'lucide-react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';

const Layout: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const { role } = useAuth();

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <aside className={`fixed z-30 inset-y-0 left-0 w-64 bg-white shadow-lg transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-center h-16 bg-blue-600 text-white font-bold text-xl">
                    Hôpital Inventaire
                </div>
                <nav className="mt-5 px-4 space-y-2">
                    <Link to="/" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md" onClick={() => setSidebarOpen(false)}>
                        <LayoutDashboard className="w-5 h-5 mr-3" />
                        Tableau de bord
                    </Link>
                    <Link to="/materiels" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md" onClick={() => setSidebarOpen(false)}>
                        <Package className="w-5 h-5 mr-3" />
                        Matériels
                    </Link>
                    <Link to="/inventaire" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md" onClick={() => setSidebarOpen(false)}>
                        <ClipboardList className="w-5 h-5 mr-3" />
                        Campagne Inventaire
                    </Link>

                    {/* Lien Admin seulement */}
                    {role === 'admin' && (
                        <Link to="/users" className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-md" onClick={() => setSidebarOpen(false)}>
                            <Users className="w-5 h-5 mr-3" />
                            Agents
                        </Link>
                    )}

                    <button
                        onClick={() => { supabase.auth.signOut(); setSidebarOpen(false); }}
                        className="flex w-full items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-md mt-4"
                    >
                        <span className="w-5 h-5 mr-3">🚪</span>
                        Déconnexion
                    </button>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex items-center justify-between h-16 bg-white shadow px-4 lg:hidden">
                    <button onClick={() => setSidebarOpen(true)} className="text-gray-500 focus:outline-none">
                        <Menu className="w-6 h-6" />
                    </button>
                    <span className="font-semibold text-gray-700">Inventaire</span>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
