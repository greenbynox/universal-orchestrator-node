import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Pie, PieChart, ResponsiveContainer, Cell, LineChart, Line, XAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { dashboardApi } from '../services/api';
import type { Alert } from '../types';

const palette = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7'];

export default function DashboardPage() {
  const [stats, setStats] = useState<any | null>(null);
  const [history, setHistory] = useState<{ time: string; cpu: number; memory: number; disk: number }[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await dashboardApi.getStats();
        setStats(data);
        setHistory((prev) => [
          ...prev.slice(-60),
          {
            time: new Date().toLocaleTimeString(),
            cpu: data.totalCPU,
            memory: data.totalMemory,
            disk: data.totalDisk,
          },
        ]);
      } catch (error) {
        console.error(error);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const blockchainData = useMemo(() => {
    if (!stats?.byBlockchain) return [];
    return Object.entries(stats.byBlockchain).map(([name, value]: any, index) => ({
      name,
      value: value.count,
      color: palette[index % palette.length],
    }));
  }, [stats]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-dark-400">Vue temps réel de vos nodes</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Nodes', value: stats?.totalNodes ?? '-', sub: `${stats?.nodesRunning ?? 0} running` },
          { label: 'En erreur', value: stats?.nodesFailing ?? 0, sub: 'nodes failing' },
          { label: 'CPU', value: `${stats?.totalCPU ?? 0}%`, sub: 'total usage' },
          { label: 'Mémoire', value: `${stats?.totalMemory ?? 0}%`, sub: 'total usage' },
        ].map((card, idx) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-dark-800 border border-dark-700 rounded-xl p-4"
          >
            <p className="text-sm text-dark-400">{card.label}</p>
            <p className="text-2xl font-semibold text-white">{card.value}</p>
            <p className="text-xs text-dark-500">{card.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-4 xl:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold">Ressources (1h)</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="time" hide />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="cpu" stroke="#22c55e" dot={false} name="CPU %" />
                <Line type="monotone" dataKey="memory" stroke="#6366f1" dot={false} name="RAM %" />
                <Line type="monotone" dataKey="disk" stroke="#f59e0b" dot={false} name="Disk %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
          <h3 className="text-white font-semibold mb-3">Nodes par blockchain</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={blockchainData} dataKey="value" nameKey="name" outerRadius={80} label>
                  {blockchainData.map((entry, idx) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="bg-dark-800 border border-dark-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">Alertes récentes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-dark-400">
                <th className="py-2">Type</th>
                <th>Severity</th>
                <th>Message</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.recentAlerts || []).map((alert: Alert) => (
                <tr key={alert.id} className="border-t border-dark-700">
                  <td className="py-2 text-white">{alert.type}</td>
                  <td>
                    <span className={`px-2 py-1 rounded text-xs ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-red-500/20 text-red-400'
                        : alert.severity === 'WARNING'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {alert.severity}
                    </span>
                  </td>
                  <td className="text-dark-200">{alert.message}</td>
                  <td className="text-dark-400">{new Date(alert.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!stats?.recentAlerts || stats.recentAlerts.length === 0) && (
            <p className="text-dark-400 py-4 text-center">Aucune alerte active</p>
          )}
        </div>
      </div>
    </div>
  );
}
