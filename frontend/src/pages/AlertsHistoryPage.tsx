import { useEffect, useState } from 'react';
import { alertsApi } from '../services/api';
import type { Alert, AlertSeverity, AlertType } from '../types';

export default function AlertsHistoryPage() {
  const [items, setItems] = useState<Alert[]>([]);
  const [resolved, setResolved] = useState<string>('null');
  const [severity, setSeverity] = useState<AlertSeverity | 'all'>('all');

  const load = async () => {
    const res = await alertsApi.list({ resolved: resolved === 'null' ? null : resolved === 'true' });
    const filtered = severity === 'all' ? res.items : res.items.filter((a) => a.severity === severity);
    setItems(filtered as Alert[]);
  };

  useEffect(() => {
    void load();
  }, [resolved, severity]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Historique des alertes</h1>
          <p className="text-dark-400">Filtrer et exporter vos alertes</p>
        </div>
        <div className="flex gap-2">
          <select value={severity} onChange={(e) => setSeverity(e.target.value as AlertSeverity | 'all')} className="select-base">
            <option value="all">Toutes</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="WARNING">WARNING</option>
            <option value="INFO">INFO</option>
          </select>
          <select value={resolved} onChange={(e) => setResolved(e.target.value)} className="select-base">
            <option value="null">Toutes</option>
            <option value="false">Actives</option>
            <option value="true">Résolues</option>
          </select>
        </div>
      </div>

      <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-dark-900 text-dark-400">
            <tr>
              <th className="px-4 py-2 text-left">Timestamp</th>
              <th className="text-left">Type</th>
              <th className="text-left">Severity</th>
              <th className="text-left">Node</th>
              <th className="text-left">Message</th>
              <th className="text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id} className="border-t border-dark-700">
                <td className="px-4 py-2 text-dark-400">{new Date(a.timestamp).toLocaleString()}</td>
                <td className="text-white">{a.type}</td>
                <td>
                  <span className={`px-2 py-1 rounded text-xs ${
                    a.severity === 'CRITICAL'
                      ? 'bg-red-500/20 text-red-400'
                      : a.severity === 'WARNING'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {a.severity}
                  </span>
                </td>
                <td className="text-dark-200">{a.nodeId || '-'}</td>
                <td className="text-dark-100">{a.message}</td>
                <td className="text-dark-300">{a.resolved ? 'Résolue' : 'Active'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="text-center text-dark-400 py-6">Aucune alerte</p>}
      </div>
    </div>
  );
}
