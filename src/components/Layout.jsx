import { useState, useRef, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import apiClient from '../api/client';

const BREADCRUMB_MAP = {
  '/': 'Tableau de bord',
  '/clients': 'Clients',
  '/fournisseurs': 'Fournisseurs',
  '/factures-vente': 'Factures de vente',
  '/factures-achat': "Factures d'achat",
  '/paiements': 'Paiements',
  '/articles': 'Articles',
  '/comptabilite': 'Comptabilité',
  '/rapports': 'Rapports',
  '/parametres': 'Paramètres',
};

function Breadcrumb() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = [];
  let path = '';
  for (const seg of segments) {
    path += `/${seg}`;
    const label = BREADCRUMB_MAP[path] || seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');
    crumbs.push({ path, label });
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs">
      {crumbs.map((cr, i) => (
        <span key={cr.path} className="flex items-center gap-1.5">
          {i > 0 && (
            <svg className="w-3 h-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          )}
          <span className={i === crumbs.length - 1 ? 'text-cobilan-600 font-semibold' : 'text-gray-400'}>
            {cr.label}
          </span>
        </span>
      ))}
    </nav>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifCount();
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setDropdownOpen(false);
  }, [location.pathname]);

  const fetchNotifCount = async () => {
    try {
      const res = await apiClient.get('/method/frappe.desk.notifications.get_notifications');
      setNotifCount(res.data?.message?.open_count_negative || 0);
    } catch {
      // silencieux
    }
  };

  const initials = (user?.full_name || user?.email || '?').charAt(0).toUpperCase();
  const fullName = user?.full_name || user?.email || 'Utilisateur';

  return (
    <div className="min-h-screen bg-gray-50/50 flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <header className="sticky top-0 z-30 h-14 bg-white/90 backdrop-blur-sm border-b border-gray-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 transition"
              aria-label="Menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <div className="hidden lg:block">
              <Breadcrumb />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <button
              onClick={fetchNotifCount}
              className="relative p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
              aria-label="Notifications"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              {notifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </button>

            {/* Connection indicator */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_4px_rgba(34,197,94,0.4)]" />
            </div>

            {/* Avatar + dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-gray-100 transition"
                aria-label="Menu utilisateur"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cobilan-500 to-cobilan-700 text-white flex items-center justify-center text-xs font-bold ring-2 ring-white ring-offset-1 shrink-0">
                  {initials}
                </div>
                <span className="hidden sm:block text-sm font-medium text-gray-900 max-w-[140px] truncate">
                  {fullName}
                </span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-100 shadow-xl rounded-2xl p-1.5 z-50">
                  <div className="px-3 py-2 border-b border-gray-100 mb-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{fullName}</p>
                    <p className="text-xs text-gray-400 truncate">{user?.email || ''}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 rounded-xl hover:bg-red-50 hover:text-red-600 transition"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Breadcrumb mobile */}
        <div className="lg:hidden px-4 pt-3 pb-1">
          <Breadcrumb />
        </div>

        <main className="flex-1 overflow-y-auto px-4 lg:px-6 py-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
