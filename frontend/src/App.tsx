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

function App() {
  const { setNodes, setWallets, setSystemResources, setLoading, setConnected } = useStore();

  useEffect(() => {
    // Charger les données initiales
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [nodes, wallets, resources] = await Promise.all([
          nodesApi.getAll(),
          walletsApi.getAll(),
          systemApi.getResources(),
        ]);
        
        setNodes(nodes);
        setWallets(wallets);
        setSystemResources(resources);
        setConnected(true);  // API is responding = connected
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
        setConnected(true);
      } catch {
        setConnected(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [setNodes, setWallets, setSystemResources, setLoading, setConnected]);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/nodes" element={<NodesPage />} />
        <Route path="/wallets" element={<WalletsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/alerts" element={<AlertsHistoryPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
