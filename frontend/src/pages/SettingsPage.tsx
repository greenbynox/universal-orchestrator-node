import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CircleStackIcon,
  ServerStackIcon,
  HeartIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { settingsApi, systemApi } from '../services/api';
import { useLanguage } from '../i18n';
import { DONATION_NETWORKS, type DonationNetwork } from '../config/donations';

type Severity = 'info' | 'warning' | 'critical';

type SettingsState = {
  // Docker / infra
  dockerAutoStart: boolean;
  skipDockerCheck: boolean;
  dockerMaxRetries: number;
  dockerRetryDelayMs: number;
  // Nodes
  nodeMaxConcurrent: number;
  nodeAutoRestart: boolean;
  nodeStartTimeoutMs: number;
  // Alerts / health
  alertCpuThreshold: number;
  alertRamThreshold: number;
  alertDiskThresholdGB: number;
  healthcheckIntervalSeconds: number;
  // API / sécurité
  apiRateLimitEnabled: boolean;
  apiAuthMode: 'none' | 'basic' | 'token';
  apiToken: string;
  apiBasicUser: string;
  apiBasicPass: string;
  allowedOrigins: string;
  // Intégrations
  discordWebhookUrl: string;
  telegramBotToken: string;
  telegramChatId: string;
  alertMinSeverity: Severity;
  // UX / logs
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  logToFile: boolean;
  logFilePath: string;
  detailedLogNotifications: boolean;
  uiLanguage: 'fr' | 'en';
  uiTheme: 'light' | 'dark';
};

const SETTINGS_STORAGE_KEY = 'orchestratorSettings';

const DEFAULT_SETTINGS: SettingsState = {
  dockerAutoStart: true,
  skipDockerCheck: false,
  dockerMaxRetries: 30,
  dockerRetryDelayMs: 4000,
  nodeMaxConcurrent: 3,
  nodeAutoRestart: true,
  nodeStartTimeoutMs: 60000,
  alertCpuThreshold: 85,
  alertRamThreshold: 85,
  alertDiskThresholdGB: 20,
  healthcheckIntervalSeconds: 30,
  apiRateLimitEnabled: true,
  apiAuthMode: 'none',
  apiToken: '',
  apiBasicUser: '',
  apiBasicPass: '',
  allowedOrigins: 'http://localhost:5173,http://localhost:3000',
  discordWebhookUrl: '',
  telegramBotToken: '',
  telegramChatId: '',
  alertMinSeverity: 'warning',
  logLevel: 'info',
  logToFile: false,
  logFilePath: './logs/app.log',
  detailedLogNotifications: false,
  uiLanguage: 'fr',
  uiTheme: 'dark',
};

function getPreferredTheme(): 'light' | 'dark' {
  try {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  } catch {
    return 'dark';
  }
}

function normalizeUiTheme(raw: unknown): 'light' | 'dark' {
  if (raw === 'light' || raw === 'dark') return raw;
  // Backward-compat: old settings may have stored "system".
  if (raw === 'system') return getPreferredTheme();
  return 'dark';
}

export default function SettingsPage() {
  const { t, language, setLanguage } = useLanguage();
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [systemHealth, setSystemHealth] = useState<{
    status: string;
    uptime: number;
    version: string;
  } | null>(null);
  const [dockerStatus, setDockerStatus] = useState<{
    available: boolean;
    message: string;
    mockEnabled: boolean;
  } | null>(null);
  const [showDonation, setShowDonation] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<DonationNetwork>(DONATION_NETWORKS[0]);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [searchNetwork, setSearchNetwork] = useState('');
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const selectedDonation = selectedNetwork.addresses[selectedAddressIndex] ?? selectedNetwork.addresses[0];
  const selectedDonationAddress = String(selectedDonation?.address ?? '');

  useEffect(() => {
    // Charger les paramètres depuis le localStorage
    try {
      const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const merged = { ...DEFAULT_SETTINGS, ...parsed };
        merged.uiTheme = normalizeUiTheme((merged as any).uiTheme);
        setSettings(merged);
      }
    } catch (err) {
      console.warn('Impossible de charger les paramètres, utilisation des valeurs par défaut', err);
      setSettings(DEFAULT_SETTINGS);
    }

    // Charger les paramètres côté backend (ceux qui ont un impact serveur)
    (async () => {
      try {
        const backendSettings = await settingsApi.get();
        setSettings((prev) => {
          const merged = { ...prev, ...backendSettings } as any;
          merged.uiTheme = normalizeUiTheme(merged.uiTheme);
          return merged as SettingsState;
        });
      } catch (err) {
        // Best-effort: settings backend peut être indisponible (ex: backend en démarrage)
        console.debug('Settings backend non disponible, fallback localStorage', err);
      }
    })();

    const loadData = async () => {
      try {
        const health = await systemApi.health();
        setSystemHealth(health);

        // Load Docker status
        const response = await fetch('/api/system/status');
        const data = await response.json();
        if (data.success && data.data.docker) {
          setDockerStatus({
            available: data.data.docker.available,
            message: data.data.docker.message,
            mockEnabled: data.data.docker.mockEnabled,
          });
        }
      } catch (error) {
        console.error('Erreur chargement settings:', error);
        // Set default values if API fails
        setSystemHealth({
          status: 'healthy',
          uptime: 0,
          version: '2.2.0'
        });
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    // Reset address selection when switching network
    setSelectedAddressIndex(0);
  }, [selectedNetwork.id]);

  const applyTheme = (theme: 'light' | 'dark') => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
  };

  // Persist settings locally
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (err) {
      console.warn('Impossible de sauvegarder les paramètres', err);
    }
  }, [settings]);

  // Apply theme instantly
  useEffect(() => {
    applyTheme(settings.uiTheme);
  }, [settings.uiTheme]);

  // Sync document + i18n language (must be done outside render)
  useEffect(() => {
    document.documentElement.lang = settings.uiLanguage;
    if (settings.uiLanguage !== language) {
      setLanguage(settings.uiLanguage);
    }
  }, [settings.uiLanguage, language, setLanguage]);

  const updateSettings = (partial: Partial<SettingsState>) => {
    // IMPORTANT: keep this function pure (no side-effects inside setState updater)
    setSettingsError(null);
    setSettings(prev => ({ ...prev, ...partial }));

    // Persist server-impacting settings to backend (best-effort)
    const serverKeys = new Set([
      'dockerAutoStart',
      'skipDockerCheck',
      'dockerMaxRetries',
      'dockerRetryDelayMs',
      'nodeMaxConcurrent',
      'nodeAutoRestart',
      'nodeStartTimeoutMs',
      'alertCpuThreshold',
      'alertRamThreshold',
      'alertDiskThresholdGB',
      'healthcheckIntervalSeconds',
      'apiRateLimitEnabled',
      'apiAuthMode',
      'apiToken',
      'apiBasicUser',
      'apiBasicPass',
      'allowedOrigins',
      'discordWebhookUrl',
      'telegramBotToken',
      'telegramChatId',
      'alertMinSeverity',
      'logLevel',
      'logToFile',
      'logFilePath',
    ]);

    const payload: Record<string, any> = {};
    Object.entries(partial).forEach(([k, v]) => {
      if (serverKeys.has(k) && typeof v !== 'undefined') {
        payload[k] = v;
      }
    });

    if (Object.keys(payload).length > 0) {
      // Avoid bricking the backend: don't push auth mode changes without credentials.
      const next = { ...settings, ...partial };

      // If user is editing credentials while a mode is selected, ensure the backend also receives the mode.
      if (next.apiAuthMode === 'token' && typeof payload.apiToken === 'string' && !payload.apiAuthMode) {
        payload.apiAuthMode = 'token';
      }
      if (next.apiAuthMode === 'basic' && (typeof payload.apiBasicUser === 'string' || typeof payload.apiBasicPass === 'string') && !payload.apiAuthMode) {
        payload.apiAuthMode = 'basic';
      }

      if (payload.apiAuthMode) {
        if (next.apiAuthMode === 'token' && !String(next.apiToken || '').trim()) {
          setSettingsError('Mode "token" sélectionné: veuillez définir un API token avant de l\'activer.');
          return;
        }
        if (next.apiAuthMode === 'basic' && (!String(next.apiBasicUser || '').trim() || !String(next.apiBasicPass || '').trim())) {
          setSettingsError('Mode "basic" sélectionné: veuillez définir username + password avant de l\'activer.');
          return;
        }
      }

      void settingsApi.update(payload).catch((err) => {
        console.debug('Impossible de sauvegarder côté backend (continuation en local)', err);
      });
    }
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}j ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const copyAddress = async (address: string) => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const filteredNetworks = DONATION_NETWORKS.filter(
    n => n.name.toLowerCase().includes(searchNetwork.toLowerCase()) ||
         n.symbol.toLowerCase().includes(searchNetwork.toLowerCase())
  );

  const renderToggle = (label: string, value: boolean, onChange: (v: boolean) => void, helper?: string) => (
    <div className="flex items-start justify-between gap-4 bg-dark-900 rounded-lg p-4">
      <div>
        <p className="text-white font-medium">{label}</p>
        {helper && <p className="text-sm text-dark-400 mt-1">{helper}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`w-14 h-8 rounded-full relative transition ${value ? 'bg-green-500' : 'bg-dark-600'}`}
      >
        <span className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition ${value ? 'translate-x-6' : ''}`} />
      </button>
    </div>
  );

  const renderInput = (label: string, value: string | number, onChange: (v: string) => void, helper?: string, type: string = 'text') => (
    <div className="bg-dark-900 rounded-lg p-4 space-y-2">
      <p className="text-white font-medium">{label}</p>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white focus:border-primary-500 outline-none"
      />
      {helper && <p className="text-sm text-dark-400">{helper}</p>}
    </div>
  );

  const renderSelect = <T extends string>(label: string, value: T, options: { value: T; label: string }[], onChange: (v: T) => void, helper?: string) => (
    <div className="bg-dark-900 rounded-lg p-4 space-y-2">
      <p className="text-white font-medium">{label}</p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white focus:border-primary-500 outline-none"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {helper && <p className="text-sm text-dark-400">{helper}</p>}
    </div>
  );

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">{t('settings.title')}</h1>
        <p className="text-dark-400 mt-1">{t('settings.config')}</p>
      </div>

      {/* Free Software Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 rounded-xl p-6 border border-green-700/50"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-500/20 rounded-xl">
            <GlobeAltIcon className="w-8 h-8 text-green-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-green-400 mb-2">
              {t('settings.free')}
            </h2>
            <p className="text-dark-300 leading-relaxed">
              <strong className="text-white">Node Orchestrator</strong> {t('settings.freeDesc')}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                {t('settings.noLimit')}
              </span>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                {t('settings.blockchains')}
              </span>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                {t('settings.openSource')}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Statut système */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-dark-800 rounded-xl p-6 border border-dark-700"
      >
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <ServerStackIcon className="w-6 h-6 text-primary-500" />
          {t('settings.systemStatus')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-dark-900 rounded-lg p-4">
            <p className="text-sm text-dark-400 mb-1">{t('settings.status')}</p>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                systemHealth?.status === 'healthy' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
              }`} />
              <p className="text-white font-medium capitalize">
                {systemHealth?.status === 'healthy' ? t('settings.status.online') : t('settings.status.starting')}
              </p>
            </div>
          </div>
          <div className="bg-dark-900 rounded-lg p-4">
            <p className="text-sm text-dark-400 mb-1">{t('settings.uptime')}</p>
            <p className="text-white font-medium">
              {systemHealth ? formatUptime(systemHealth.uptime) : '0m'}
            </p>
          </div>
          <div className="bg-dark-900 rounded-lg p-4">
            <p className="text-sm text-dark-400 mb-1">Version</p>
            <p className="text-white font-medium">v{systemHealth?.version || '2.2.0'}</p>
          </div>
        </div>
      </motion.div>

      {/* Paramètres rapides (persistés localement) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-dark-800 rounded-xl p-6 border border-dark-700 space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">{t('settings.title')}</h2>
          <p className="text-sm text-dark-400">{t('settings.defaultHelper')}</p>
        </div>

        {/* Docker / Infra */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">{t('settings.dockerInfra')}</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {renderToggle(t('settings.autoStartDocker'), settings.dockerAutoStart, (v) => updateSettings({ dockerAutoStart: v }), t('settings.helper.autoStartDocker'))}
            {renderToggle(t('settings.skipDocker'), settings.skipDockerCheck, (v) => updateSettings({ skipDockerCheck: v }), t('settings.helper.skipDocker'))}
            {renderInput(t('settings.retries'), settings.dockerMaxRetries, (v) => updateSettings({ dockerMaxRetries: Number(v) || 0 }), t('settings.helper.retries'), 'number')}
            {renderInput(t('settings.retryDelay'), settings.dockerRetryDelayMs, (v) => updateSettings({ dockerRetryDelayMs: Number(v) || 0 }), t('settings.helper.retryDelay'), 'number')}
          </div>
        </div>

        {/* Nodes */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">{t('settings.nodes')}</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {renderInput(t('settings.maxNodes'), settings.nodeMaxConcurrent, (v) => updateSettings({ nodeMaxConcurrent: Number(v) || 0 }), t('settings.helper.maxNodes'), 'number')}
            {renderToggle(t('settings.autoRestart'), settings.nodeAutoRestart, (v) => updateSettings({ nodeAutoRestart: v }), t('settings.helper.autoRestart'))}
            {renderInput(t('settings.startTimeout'), settings.nodeStartTimeoutMs, (v) => updateSettings({ nodeStartTimeoutMs: Number(v) || 0 }), t('settings.helper.startTimeout'), 'number')}
          </div>
        </div>

        {/* Alertes / Health */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">{t('settings.alertsHealth')}</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {renderInput(t('settings.cpuThreshold'), settings.alertCpuThreshold, (v) => updateSettings({ alertCpuThreshold: Number(v) || 0 }), undefined, 'number')}
            {renderInput(t('settings.ramThreshold'), settings.alertRamThreshold, (v) => updateSettings({ alertRamThreshold: Number(v) || 0 }), undefined, 'number')}
            {renderInput(t('settings.diskThreshold'), settings.alertDiskThresholdGB, (v) => updateSettings({ alertDiskThresholdGB: Number(v) || 0 }), t('settings.helper.diskThreshold'), 'number')}
            {renderInput(t('settings.healthInterval'), settings.healthcheckIntervalSeconds, (v) => updateSettings({ healthcheckIntervalSeconds: Number(v) || 0 }), t('settings.helper.healthInterval'), 'number')}
          </div>
        </div>

        {/* Sécurité / API */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">{t('settings.securityApi')}</h3>
          {settingsError && (
            <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4 text-red-200 text-sm">
              {settingsError}
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-3">
            {renderToggle(t('settings.rateLimit'), settings.apiRateLimitEnabled, (v) => updateSettings({ apiRateLimitEnabled: v }), t('settings.helper.rateLimit'))}
            {renderSelect(t('settings.authMode'), settings.apiAuthMode, [
              { value: 'none', label: t('settings.none') },
              { value: 'token', label: t('settings.token') },
              { value: 'basic', label: t('settings.basic') },
            ], (v) => updateSettings({ apiAuthMode: v as SettingsState['apiAuthMode'] }))}

            {settings.apiAuthMode === 'token' && (
              <>
                {renderInput('API Token', settings.apiToken, (v) => updateSettings({ apiToken: v }), 'Env: API_TOKEN (stocké dans data/settings.json)', 'password')}
              </>
            )}

            {settings.apiAuthMode === 'basic' && (
              <>
                {renderInput('API Basic Username', settings.apiBasicUser, (v) => updateSettings({ apiBasicUser: v }), 'Env: API_BASIC_USER')}
                {renderInput('API Basic Password', settings.apiBasicPass, (v) => updateSettings({ apiBasicPass: v }), 'Env: API_BASIC_PASS', 'password')}
              </>
            )}

            {renderInput(t('settings.allowedOrigins'), settings.allowedOrigins, (v) => updateSettings({ allowedOrigins: v }), t('settings.helper.allowedOrigins'))}
          </div>
        </div>

        {/* Intégrations */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">{t('settings.integrations')}</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {renderInput(t('settings.discord'), settings.discordWebhookUrl, (v) => updateSettings({ discordWebhookUrl: v }))}
            {renderInput(t('settings.tgToken'), settings.telegramBotToken, (v) => updateSettings({ telegramBotToken: v }))}
            {renderInput(t('settings.tgChat'), settings.telegramChatId, (v) => updateSettings({ telegramChatId: v }))}
            {renderSelect<Severity>(t('settings.minAlert'), settings.alertMinSeverity, [
              { value: 'info', label: t('settings.info') },
              { value: 'warning', label: t('settings.warning') },
              { value: 'critical', label: t('settings.critical') },
            ], (v) => updateSettings({ alertMinSeverity: v }))}
          </div>
        </div>

        {/* UX / Logs */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">{t('settings.uxLogs')}</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {renderSelect<'debug' | 'info' | 'warn' | 'error'>(t('settings.logLevel'), settings.logLevel, [
              { value: 'debug', label: t('settings.debug') },
              { value: 'info', label: t('settings.infoLevel') },
              { value: 'warn', label: t('settings.warn') },
              { value: 'error', label: t('settings.error') },
            ], (v) => updateSettings({ logLevel: v }))}
            {renderToggle(t('settings.logToFile'), settings.logToFile, (v) => updateSettings({ logToFile: v }))}
            {renderInput(t('settings.logPath'), settings.logFilePath, (v) => updateSettings({ logFilePath: v }))}
            {renderToggle(t('settings.detailedLogNotifications'), settings.detailedLogNotifications, (v) => updateSettings({ detailedLogNotifications: v }), t('settings.helper.detailedLogNotifications'))}
            {renderSelect<'fr' | 'en'>(t('settings.uiLang'), settings.uiLanguage, [
              { value: 'fr', label: t('settings.french') },
              { value: 'en', label: t('settings.english') },
            ], (v) => updateSettings({ uiLanguage: v }))}
            {renderSelect<'light' | 'dark'>(t('settings.theme'), settings.uiTheme, [
              { value: 'light', label: t('settings.light') },
              { value: 'dark', label: t('settings.dark') },
            ], (v) => updateSettings({ uiTheme: v }))}
          </div>
        </div>
      </motion.div>

      {/* Donations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-dark-800 rounded-xl p-6 border border-dark-700"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <HeartIcon className="w-6 h-6 text-pink-500" />
            {t('settings.donation')}
          </h2>
          <button
            onClick={() => setShowDonation(!showDonation)}
            className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg font-medium transition-colors"
          >
            {showDonation ? t('settings.closeBtn') : t('settings.donateBtn')}
          </button>
        </div>

        <p className="text-dark-300 mb-4">
          {t('settings.donationText', { count: DONATION_NETWORKS.length })}
        </p>

        {showDonation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="border-t border-dark-700 pt-4 mt-4"
          >
            <input
              type="text"
              placeholder={t('settings.searchNetwork')}
              value={searchNetwork}
              onChange={(e) => setSearchNetwork(e.target.value)}
              className="w-full bg-dark-900 text-white rounded-lg px-4 py-3 mb-4 border border-dark-600 focus:border-primary-500 focus:outline-none"
            />

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-48 overflow-y-auto mb-4">
              {filteredNetworks.map((network) => (
                <button
                  key={network.id}
                  onClick={() => setSelectedNetwork(network)}
                  className={`p-2 rounded-lg text-center transition-all ${
                    selectedNetwork.id === network.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-dark-900 hover:bg-dark-700 text-dark-300'
                  }`}
                >
                  <span className="text-lg">{network.icon}</span>
                  <p className="text-xs font-medium truncate">{network.symbol}</p>
                </button>
              ))}
            </div>

            <div className="bg-dark-900 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{selectedNetwork.icon}</span>
                <div>
                  <p className="text-white font-semibold">{selectedNetwork.name}</p>
                  <p className="text-dark-400 text-sm">{selectedNetwork.symbol}</p>
                </div>
              </div>

              {selectedNetwork.addresses.length > 1 && (
                <div className="mb-3">
                  <select
                    value={String(selectedAddressIndex)}
                    onChange={(e) => setSelectedAddressIndex(Number(e.target.value) || 0)}
                    className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-white focus:border-primary-500 outline-none"
                  >
                    {selectedNetwork.addresses.map((a, idx) => (
                      <option key={idx} value={String(idx)}>
                        {a.label ? a.label : `Address ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                  {selectedDonation?.derivationPath && (
                    <p className="text-xs text-dark-400 mt-2 font-mono">
                      {selectedDonation.derivationPath}
                    </p>
                  )}
                </div>
              )}
              
              {selectedDonationAddress.trim() ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={selectedDonationAddress}
                    readOnly
                    className="flex-1 bg-dark-800 text-white rounded-lg px-3 py-2 text-sm font-mono"
                  />
                  <button
                    onClick={() => copyAddress(selectedDonationAddress)}
                    className="p-2 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors"
                  >
                    {copiedAddress === selectedDonationAddress ? (
                      <CheckIcon className="w-5 h-5 text-green-500" />
                    ) : (
                      <ClipboardDocumentIcon className="w-5 h-5 text-dark-400" />
                    )}
                  </button>
                </div>
              ) : (
                <p className="text-dark-400 text-sm italic">
                  {t('settings.donationAddressMissing')}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Configuration Docker */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-dark-800 rounded-xl p-6 border border-dark-700"
      >
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <CircleStackIcon className="w-6 h-6 text-primary-500" />
          {t('settings.configDocker')}
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between bg-dark-900 rounded-lg p-4">
            <div>
              <p className="text-white font-medium">Docker Status</p>
              <p className="text-sm text-dark-400">
                {dockerStatus ? (
                  <>
                    {dockerStatus.available ? (
                      <span className="text-green-400">{t('settings.dockerAvailable')}</span>
                    ) : dockerStatus.mockEnabled ? (
                      <span className="text-yellow-400">{t('settings.dockerDev')}</span>
                    ) : (
                      <span className="text-red-400">{t('settings.dockerUnavailable')}</span>
                    )}
                  </>
                ) : (
                  t('common.loading')
                )}
              </p>
            </div>
            <div className={`w-3 h-3 rounded-full ${
              dockerStatus?.available ? 'bg-green-500' : 
              dockerStatus?.mockEnabled ? 'bg-yellow-500' :
              'bg-red-500'
            }`} />
          </div>
          <div className="flex items-center justify-between bg-dark-900 rounded-lg p-4">
            <div>
              <p className="text-white font-medium">{t('settings.dataFolder')}</p>
              <p className="text-sm text-dark-400">./data/nodes</p>
            </div>
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
        </div>
      </motion.div>

      {/* À propos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-dark-800 rounded-xl p-6 border border-dark-700"
      >
        <h2 className="text-xl font-semibold text-white mb-4">{t('settings.about')}</h2>
        
        <div className="prose prose-invert max-w-none text-dark-300">
          <p>
            <strong className="text-white">Node Orchestrator</strong> - {t('settings.aboutSubtitle')}
          </p>
          <div className="bg-dark-900 rounded-lg p-4 mt-4">
            <p className="text-sm">
              <span className="text-dark-400">{t('common.version')}:</span> <span className="text-white">v{systemHealth?.version || '2.2.0'}</span><br />
              <span className="text-dark-400">{t('common.license')}:</span> <span className="text-green-400">{t('settings.licenseValue')}</span><br />
              <span className="text-dark-400">{t('common.github')}:</span>{' '}
              <a 
                href="https://github.com/greenbynox/universal-orchestrator-node" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300"
              >
                github.com/greenbynox/universal-orchestrator-node
              </a><br />
              <span className="text-dark-400">{t('common.documentation')}:</span>{' '}
              <a 
                href="https://greenbynox.github.io/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300"
              >
                greenbynox.github.io
              </a>
            </p>
          </div>
          
          <div className="flex gap-3 mt-4">
            <a
              href="https://github.com/greenbynox/universal-orchestrator-node"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-dark-700 hover:bg-dark-600 rounded-lg text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              {t('common.github')}
            </a>
            <a
              href="https://greenbynox.github.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 rounded-lg text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h11a3 3 0 0 0 3-3V7.828a2 2 0 0 0-.586-1.414l-2.828-2.828A2 2 0 0 0 15.172 3H6zm10 0.414L19.586 6H17a1 1 0 0 1-1-1V2.414zM7 9h10v2H7V9zm0 4h10v2H7v-2zm0 4h7v2H7v-2z" />
              </svg>
              {t('common.documentation')}
            </a>
          </div>
          <p className="text-sm mt-4 text-dark-400">
            {t('settings.madeWithLove')}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
