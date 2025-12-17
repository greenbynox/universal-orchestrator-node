import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import NodesPage from './pages/NodesPage';
import WalletsPage from './pages/WalletsPage';
import SettingsPage from './pages/SettingsPage';
import AlertsHistoryPage from './pages/AlertsHistoryPage';
import { nodesApi, walletsApi, systemApi } from './services/api';
import { useStore } from './store';
import { I18nProvider } from './i18n';
import { wsService } from './services/websocket';

function App() {
  const { setNodes, setWallets, setSystemResources, setBlockchains, setLoading, setConnected } = useStore();

  useEffect(() => {
    // Real-time updates
    wsService.connect();

    // Charger les données initiales
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [nodes, wallets, resources, blockchains] = await Promise.all([
          nodesApi.getAll(),
          walletsApi.getAll(),
          systemApi.getResources(),
          systemApi.getBlockchains().catch(() => []), // Non-critical, don't fail if missing
        ]);
        
        setNodes(nodes);
        setWallets(wallets);
        setSystemResources(resources);
        if (blockchains.length > 0) setBlockchains(blockchains);
      } catch (error) {
        console.error('Erreur chargement données:', error);
        setConnected(false);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();

    // Refresh data every 5 seconds (nodes + system resources)
    const interval = setInterval(async () => {
      try {
        const [nodes, resources] = await Promise.all([
          nodesApi.getAll(),
          systemApi.getResources(),
        ]);
        setNodes(nodes);
        setSystemResources(resources);
      } catch {
        setConnected(false);
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      wsService.disconnect();
    };
  }, [setNodes, setWallets, setSystemResources, setBlockchains, setLoading, setConnected]);

  return (
    <I18nProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/nodes" element={<NodesPage />} />
          <Route path="/wallets" element={<WalletsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/alerts" element={<AlertsHistoryPage />} />
        </Routes>
      </Layout>
    </I18nProvider>
  );
}

export default App;
