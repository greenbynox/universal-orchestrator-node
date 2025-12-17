import { useEffect, useState } from 'react';
import { alertsApi } from '../services/api';
import { useLanguage } from '../i18n';
import type { Alert, AlertSeverity, AlertType } from '../types';

export default function AlertsHistoryPage() {
  const { t, language } = useLanguage();
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
          <h1 className="text-2xl font-bold text-white">{t('alerts.title')}</h1>
          <p className="text-dark-400">{t('alerts.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <select value={severity} onChange={(e) => setSeverity(e.target.value as AlertSeverity | 'all')} className="select-base">
            <option value="all">{t('alerts.filter.all')}</option>
            <option value="CRITICAL">{t('alerts.severity.CRITICAL')}</option>
            <option value="WARNING">{t('alerts.severity.WARNING')}</option>
            <option value="INFO">{t('alerts.severity.INFO')}</option>
          </select>
          <select value={resolved} onChange={(e) => setResolved(e.target.value)} className="select-base">
            <option value="null">{t('alerts.filter.all')}</option>
            <option value="false">{t('alerts.filter.active')}</option>
            <option value="true">{t('alerts.filter.resolved')}</option>
          </select>
        </div>
      </div>

      <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-dark-900 text-dark-400">
            <tr>
              <th className="px-4 py-2 text-left">{t('alerts.table.timestamp')}</th>
              <th className="text-left">{t('alerts.table.type')}</th>
              <th className="text-left">{t('alerts.table.severity')}</th>
              <th className="text-left">{t('alerts.table.node')}</th>
              <th className="text-left">{t('alerts.table.message')}</th>
              <th className="text-left">{t('alerts.table.status')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id} className="border-t border-dark-700">
                <td className="px-4 py-2 text-dark-400">{new Date(a.timestamp).toLocaleString(language === 'fr' ? 'fr-FR' : 'en-US')}</td>
                <td className="text-white">{t(`alerts.type.${a.type}`)}</td>
                <td>
                  <span className={`px-2 py-1 rounded text-xs ${
                    a.severity === 'CRITICAL'
                      ? 'bg-red-500/20 text-red-400'
                      : a.severity === 'WARNING'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {t(`alerts.severity.${a.severity}`)}
                  </span>
                </td>
                <td className="text-dark-200">{a.nodeId || '-'}</td>
                <td className="text-dark-100">{a.message}</td>
                <td className="text-dark-300">{a.resolved ? t('alerts.status.resolved') : t('alerts.status.active')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="text-center text-dark-400 py-6">{t('alerts.empty')}</p>}
      </div>
    </div>
  );
}
