import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import NodesPage from './pages/NodesPage';
import WalletsPage from './pages/WalletsPage';
import SettingsPage from './pages/SettingsPage';
import { wsService } from './services/websocket';
import { nodesApi, walletsApi, systemApi } from './services/api';
import { useStore } from './store';

function App() {
  const { setNodes, setWallets, setSystemResources, setLoading } = useStore();

  useEffect(() => {
    // Connecter WebSocket
    wsService.connect();

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
      } catch (error) {
        console.error('Erreur chargement données:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();

    return () => {
      wsService.disconnect();
    };
  }, [setNodes, setWallets, setSystemResources, setLoading]);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/nodes" element={<NodesPage />} />
        <Route path="/wallets" element={<WalletsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
