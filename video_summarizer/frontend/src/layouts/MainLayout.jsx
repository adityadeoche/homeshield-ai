import React, { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { LayoutDashboard, Video, History, LogOut, Settings, Shield, ChevronRight, Menu, X, Code, Play } from 'lucide-react';

export default function MainLayout({ user }) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        signOut(auth);
    };

    const breadcrumbRoutes = {
        '/dashboard': 'Dashboard',
        '/analysis': 'Analysis Report',
        '/history': 'Incident History',
    };

    const currentPath = Object.keys(breadcrumbRoutes).find(path => location.pathname.startsWith(path)) || '';
    const currentPageName = currentPath ? breadcrumbRoutes[currentPath] : 'Overview';

    return (
        <div className="flex h-screen overflow-hidden bg-slate-900 text-slate-200 font-sans selection:bg-indigo-500/50">
            {/* Sidebar Navigation */}
            <aside
                className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-800 border-r border-slate-700/50 flex flex-col transition-all duration-300 z-20 shrink-0 shadow-lg relative`}
            >
                <div className={`h-20 flex items-center justify-center border-b border-slate-700/50 ${sidebarOpen ? 'px-6' : 'px-4'}`}>
                    <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20 text-white shrink-0">
                        <Shield size={sidebarOpen ? 24 : 20} className="transition-all" />
                    </div>
                    {sidebarOpen && (
                        <div className="ml-3 overflow-hidden whitespace-nowrap animate-in fade-in duration-300">
                            <h1 className="text-sm font-black text-white tracking-tight leading-4">HomeShield AI</h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5" title="Video Summarization">Surveillance</p>
                        </div>
                    )}
                </div>

                <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
                    <NavItem to="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" isOpen={sidebarOpen} />
                    <NavItem to="/history" icon={<History size={20} />} label="History Archives" isOpen={sidebarOpen} />
                </nav>

                <div className="p-4 border-t border-slate-700/50">
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center ${sidebarOpen ? 'px-4 justify-start' : 'justify-center'} py-2.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors group`}
                    >
                        <LogOut size={20} />
                        {sidebarOpen && <span className="ml-3 text-sm font-bold">Sign Out</span>}
                    </button>
                    {sidebarOpen && user && (
                        <div className="mt-4 px-4 py-3 bg-slate-900/50 rounded-xl border border-slate-700/50 flex items-center overflow-hidden">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold shrink-0 shadow-inner">
                                {user.email?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="ml-3 min-w-0">
                                <p className="text-xs font-bold text-slate-200 truncate">{user.email}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Operator</p>
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 relative">
                {/* Header / Topbar */}
                <header className="h-20 bg-slate-800 shadow-sm border-b border-slate-700/50 px-6 sm:px-8 flex items-center justify-between z-10 shrink-0">
                    <div className="flex items-center">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 mr-4 text-slate-400 hover:bg-slate-700 hover:text-slate-200 rounded-lg transition-colors hidden md:block"
                            title="Toggle Sidebar"
                        >
                            <Menu size={20} />
                        </button>

                        <div className="flex items-center text-sm font-bold text-slate-400">
                            Home
                            <ChevronRight size={14} className="mx-2 shrink-0 text-slate-600" />
                            <span className="text-indigo-400">{currentPageName}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 rounded-lg shadow-inner">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                        </span>
                        <span className="text-xs font-black text-emerald-400 uppercase tracking-widest hidden sm:inline-block">System Active</span>
                    </div>
                </header>

                <div className="flex-1 overflow-auto bg-slate-900 p-6 sm:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

function NavItem({ to, icon, label, isOpen }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) => `flex items-center py-3 rounded-xl transition-all group relative overflow-hidden ${isActive
                ? 'bg-indigo-500/20 text-indigo-400 shadow-sm border border-indigo-500/30'
                : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 border border-transparent'
                } ${isOpen ? 'px-4' : 'justify-center'}`}
            title={!isOpen ? label : ''}
        >
            {({ isActive }) => (
                <>
                    {isActive && (
                        <div className="absolute left-0 top-0 w-1 h-full bg-indigo-500 rounded-r-full"></div>
                    )}
                    <span className={`shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-400'}`}>
                        {icon}
                    </span>
                    {isOpen && (
                        <span className="ml-3 text-sm font-bold tracking-wide">
                            {label}
                        </span>
                    )}
                </>
            )}
        </NavLink>
    );
}
