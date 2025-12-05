import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HomeIcon,
  ServerStackIcon,
  WalletIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  SignalIcon,
  SignalSlashIcon,
} from '@heroicons/react/24/outline';
import { useStore } from '../store';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/', icon: HomeIcon, label: 'Dashboard' },
  { path: '/nodes', icon: ServerStackIcon, label: 'Nodes' },
  { path: '/wallets', icon: WalletIcon, label: 'Wallets' },
  { path: '/settings', icon: Cog6ToothIcon, label: 'Paramètres' },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { isConnected, sidebarOpen, setSidebarOpen, nodes } = useStore();

  const runningNodes = nodes.filter(
    (n) => n.state?.status === 'ready' || n.state?.status === 'syncing'
  ).length;

  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        transition={{ type: 'spring', damping: 25 }}
        className="fixed left-0 top-0 h-full w-64 bg-dark-900 border-r border-dark-700 z-40 flex flex-col"
      >
        {/* Logo */}
        <div className="p-6 border-b border-dark-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <ServerStackIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Node</h1>
              <p className="text-xs text-dark-400">Orchestrator</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-dark-300 hover:bg-dark-800 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Status */}
        <div className="p-4 border-t border-dark-700">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {isConnected ? (
                <SignalIcon className="w-4 h-4 text-green-500" />
              ) : (
                <SignalSlashIcon className="w-4 h-4 text-red-500" />
              )}
              <span className="text-dark-400">
                {isConnected ? 'Connecté' : 'Déconnecté'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-dark-400">{runningNodes} node(s)</span>
              <div
                className={`w-2 h-2 rounded-full ${
                  runningNodes > 0 ? 'bg-green-500' : 'bg-dark-500'
                }`}
              />
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main content */}
      <div
        className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-0'
        }`}
      >
        {/* Top bar */}
        <header className="h-16 bg-dark-900/80 backdrop-blur border-b border-dark-700 flex items-center justify-between px-6 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-dark-800 transition-colors"
          >
            {sidebarOpen ? (
              <XMarkIcon className="w-6 h-6 text-dark-400" />
            ) : (
              <Bars3Icon className="w-6 h-6 text-dark-400" />
            )}
          </button>

          <div className="flex items-center gap-4">
            <div className="text-sm text-dark-400">
              v1.0.0 MVP
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
