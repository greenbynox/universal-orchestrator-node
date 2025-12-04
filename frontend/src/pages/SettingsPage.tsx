import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CircleStackIcon,
  ServerStackIcon,
  CreditCardIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { systemApi, paymentsApi } from '../services/api';
import { PricingPlan } from '../types';

export default function SettingsPage() {
  const [systemHealth, setSystemHealth] = useState<{
    status: string;
    uptime: number;
    version: string;
  } | null>(null);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    // Charger les informations
    const loadData = async () => {
      try {
        const [health, pricingPlans] = await Promise.all([
          systemApi.health(),
          paymentsApi.getPlans(),
        ]);
        setSystemHealth(health);
        setPlans(pricingPlans);
      } catch (error) {
        console.error('Erreur chargement settings:', error);
      }
    };
    loadData();
  }, []);

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}j ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Paramètres</h1>
        <p className="text-dark-400 mt-1">Configuration et abonnements</p>
      </div>

      {/* Statut système */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-dark-800 rounded-xl p-6 border border-dark-700"
      >
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <ServerStackIcon className="w-6 h-6 text-primary-500" />
          Statut Système
        </h2>

        {systemHealth ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-dark-900 rounded-lg p-4">
              <p className="text-sm text-dark-400 mb-1">Statut</p>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  systemHealth.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <p className="text-white font-medium capitalize">
                  {systemHealth.status === 'healthy' ? 'En ligne' : systemHealth.status}
                </p>
              </div>
            </div>
            <div className="bg-dark-900 rounded-lg p-4">
              <p className="text-sm text-dark-400 mb-1">Uptime</p>
              <p className="text-white font-medium">
                {formatUptime(systemHealth.uptime)}
              </p>
            </div>
            <div className="bg-dark-900 rounded-lg p-4">
              <p className="text-sm text-dark-400 mb-1">Version</p>
              <p className="text-white font-medium">v{systemHealth.version}</p>
            </div>
          </div>
        ) : (
          <p className="text-dark-400">Chargement...</p>
        )}
      </motion.div>

      {/* Plans & Abonnements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-dark-800 rounded-xl p-6 border border-dark-700"
      >
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <CreditCardIcon className="w-6 h-6 text-primary-500" />
          Plans & Abonnements
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => (
            <div
              key={plan.plan}
              className={`relative bg-dark-900 rounded-xl p-5 border-2 transition-all cursor-pointer ${
                selectedPlan === plan.plan
                  ? 'border-primary-500'
                  : 'border-dark-700 hover:border-dark-600'
              }`}
              onClick={() => setSelectedPlan(plan.plan)}
            >
              {/* Badge Premium */}
              {plan.plan === 'premium' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                  Populaire
                </div>
              )}

              <h3 className="text-lg font-semibold text-white capitalize mb-2">
                {plan.plan}
              </h3>
              
              <div className="mb-4">
                <span className="text-3xl font-bold text-white">
                  ${plan.priceUSD}
                </span>
                {plan.priceUSD > 0 && (
                  <span className="text-dark-400 text-sm">/mois</span>
                )}
              </div>

              <ul className="space-y-2 mb-4">
                {plan.features.slice(0, 4).map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-dark-300">
                    <CheckIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-2 rounded-lg font-medium transition-colors ${
                  plan.plan === 'free'
                    ? 'bg-dark-700 text-dark-300 cursor-default'
                    : 'bg-primary-600 hover:bg-primary-500 text-white'
                }`}
                disabled={plan.plan === 'free'}
              >
                {plan.plan === 'free' ? 'Plan actuel' : 'Souscrire'}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-dark-900 rounded-lg p-4">
          <p className="text-sm text-dark-400">
            💳 Paiements acceptés: <span className="text-white">BTC, ETH, USDC</span>
            <br />
            Les abonnements sont mensuels et peuvent être annulés à tout moment.
          </p>
        </div>
      </motion.div>

      {/* Configuration Docker */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-dark-800 rounded-xl p-6 border border-dark-700"
      >
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <CircleStackIcon className="w-6 h-6 text-primary-500" />
          Configuration
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between bg-dark-900 rounded-lg p-4">
            <div>
              <p className="text-white font-medium">Docker Socket</p>
              <p className="text-sm text-dark-400">/var/run/docker.sock</p>
            </div>
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>

          <div className="flex items-center justify-between bg-dark-900 rounded-lg p-4">
            <div>
              <p className="text-white font-medium">Dossier de données</p>
              <p className="text-sm text-dark-400">./data/nodes</p>
            </div>
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>

          <div className="flex items-center justify-between bg-dark-900 rounded-lg p-4">
            <div>
              <p className="text-white font-medium">Réseau Docker</p>
              <p className="text-sm text-dark-400">node-orchestrator-network</p>
            </div>
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
        </div>
      </motion.div>

      {/* À propos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-dark-800 rounded-xl p-6 border border-dark-700"
      >
        <h2 className="text-xl font-semibold text-white mb-4">À propos</h2>
        
        <div className="prose prose-invert max-w-none text-dark-300">
          <p>
            <strong className="text-white">Node Orchestrator</strong> est un MVP d'orchestrateur de nodes multi-blockchains 
            permettant de gérer facilement des nodes Bitcoin, Ethereum, Solana, Monero et BNB Chain.
          </p>
          <p>
            Version: 1.0.0 MVP<br />
            Licence: MIT (Open Source avec version Premium)<br />
            GitHub: github.com/your-username/node-orchestrator
          </p>
        </div>
      </motion.div>
    </div>
  );
}
