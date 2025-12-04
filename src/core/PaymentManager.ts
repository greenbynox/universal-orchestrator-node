/**
 * ============================================================
 * NODE ORCHESTRATOR - Payment Manager
 * ============================================================
 * Gestion des paiements crypto et abonnements
 */

import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import {
  Payment,
  PaymentStatus,
  PaymentCurrency,
  SubscriptionPlan,
  PricingPlan,
} from '../types';
import { config, PRICING_PLANS } from '../config';
import { logger } from '../utils/logger';
import { encrypt, decrypt } from '../utils/crypto';

// ============================================================
// INTERFACES
// ============================================================

interface UserSubscription {
  userId: string;
  plan: SubscriptionPlan;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  payments: string[]; // IDs des paiements
}

interface PaymentAddress {
  currency: PaymentCurrency;
  address: string;
  network: string;
}

// ============================================================
// PAYMENT MANAGER CLASS
// ============================================================

export class PaymentManager extends EventEmitter {
  private payments: Map<string, Payment> = new Map();
  private subscriptions: Map<string, UserSubscription> = new Map();
  private paymentsFile: string;
  private subscriptionsFile: string;
  private checkInterval?: NodeJS.Timeout;

  // Adresses de paiement (à configurer)
  private paymentAddresses: PaymentAddress[] = [
    { currency: 'BTC', address: config.payments.btcAddress, network: 'mainnet' },
    { currency: 'ETH', address: config.payments.ethAddress, network: 'mainnet' },
    { currency: 'USDC', address: config.payments.ethAddress, network: 'ethereum' },
  ];

  constructor() {
    super();
    this.paymentsFile = path.join(config.paths.data, 'payments.enc');
    this.subscriptionsFile = path.join(config.paths.data, 'subscriptions.enc');
    
    this.loadData();
    this.startPaymentChecker();
    
    logger.info('PaymentManager initialisé');
  }

  // ============================================================
  // INITIALISATION
  // ============================================================

  private loadData(): void {
    // Charger les paiements
    if (fs.existsSync(this.paymentsFile)) {
      try {
        const data = decrypt(fs.readFileSync(this.paymentsFile, 'utf-8'));
        const payments: Payment[] = JSON.parse(data);
        payments.forEach(p => this.payments.set(p.id, p));
      } catch (error) {
        logger.error('Erreur lors du chargement des paiements', { error });
      }
    }

    // Charger les abonnements
    if (fs.existsSync(this.subscriptionsFile)) {
      try {
        const data = decrypt(fs.readFileSync(this.subscriptionsFile, 'utf-8'));
        const subs: UserSubscription[] = JSON.parse(data);
        subs.forEach(s => this.subscriptions.set(s.userId, s));
      } catch (error) {
        logger.error('Erreur lors du chargement des abonnements', { error });
      }
    }
  }

  private savePayments(): void {
    const data = JSON.stringify(Array.from(this.payments.values()));
    fs.writeFileSync(this.paymentsFile, encrypt(data));
  }

  private saveSubscriptions(): void {
    const data = JSON.stringify(Array.from(this.subscriptions.values()));
    fs.writeFileSync(this.subscriptionsFile, encrypt(data));
  }

  // ============================================================
  // CRÉATION DE PAIEMENT
  // ============================================================

  /**
   * Créer une demande de paiement
   */
  async createPayment(
    userId: string,
    plan: SubscriptionPlan,
    currency: PaymentCurrency
  ): Promise<Payment> {
    const pricing = PRICING_PLANS[plan];
    if (!pricing) {
      throw new Error('Plan invalide');
    }

    if (pricing.priceUSD === 0) {
      throw new Error('Le plan gratuit ne nécessite pas de paiement');
    }

    // Obtenir le prix en crypto
    const cryptoAmount = await this.convertUSDToCrypto(pricing.priceUSD, currency);

    // Obtenir l'adresse de paiement
    const paymentAddress = this.paymentAddresses.find(a => a.currency === currency);
    if (!paymentAddress) {
      throw new Error(`Devise non supportée: ${currency}`);
    }

    // Créer le paiement
    const paymentId = `pay-${uuidv4().slice(0, 8)}`;
    const payment: Payment = {
      id: paymentId,
      userId,
      amount: cryptoAmount,
      currency,
      amountUSD: pricing.priceUSD,
      status: 'pending',
      toAddress: paymentAddress.address,
      plan,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // Expire dans 1 heure
    };

    this.payments.set(paymentId, payment);
    this.savePayments();

    logger.info(`Paiement créé: ${paymentId}`, { userId, plan, currency, amount: cryptoAmount });
    this.emit('payment:created', payment);

    return payment;
  }

  /**
   * Convertir USD en crypto (placeholder - utiliser une API en production)
   */
  private async convertUSDToCrypto(usdAmount: number, currency: PaymentCurrency): Promise<number> {
    // Prix approximatifs (en production, utiliser une API comme CoinGecko)
    const rates: Record<PaymentCurrency, number> = {
      BTC: 45000,
      ETH: 2500,
      USDC: 1,
      SOL: 100,
      BNB: 300,
    };

    const rate = rates[currency];
    return Math.round((usdAmount / rate) * 100000000) / 100000000; // 8 décimales
  }

  // ============================================================
  // VÉRIFICATION DES PAIEMENTS
  // ============================================================

  /**
   * Démarrer la vérification périodique des paiements
   */
  private startPaymentChecker(): void {
    this.checkInterval = setInterval(() => {
      this.checkPendingPayments();
    }, 60000); // Vérifier toutes les minutes
  }

  /**
   * Vérifier tous les paiements en attente
   */
  private async checkPendingPayments(): Promise<void> {
    const now = new Date();

    for (const payment of this.payments.values()) {
      if (payment.status !== 'pending') continue;

      // Vérifier expiration
      if (new Date(payment.expiresAt) < now) {
        payment.status = 'expired';
        this.savePayments();
        this.emit('payment:expired', payment);
        continue;
      }

      // Vérifier le paiement sur la blockchain
      try {
        const confirmed = await this.verifyPaymentOnChain(payment);
        if (confirmed) {
          payment.status = 'confirmed';
          payment.confirmedAt = new Date();
          this.savePayments();
          
          // Activer l'abonnement
          await this.activateSubscription(payment.userId, payment.plan, payment.id);
          
          this.emit('payment:confirmed', payment);
          logger.info(`Paiement confirmé: ${payment.id}`);
        }
      } catch (error) {
        logger.error(`Erreur vérification paiement ${payment.id}`, { error });
      }
    }
  }

  /**
   * Vérifier un paiement sur la blockchain
   */
  private async verifyPaymentOnChain(payment: Payment): Promise<boolean> {
    switch (payment.currency) {
      case 'ETH':
      case 'USDC':
        return this.verifyEthereumPayment(payment);
      
      case 'BTC':
        return this.verifyBitcoinPayment(payment);
      
      default:
        return false;
    }
  }

  /**
   * Vérifier un paiement Ethereum
   */
  private async verifyEthereumPayment(payment: Payment): Promise<boolean> {
    // En production, utiliser un provider Ethereum (Infura, Alchemy)
    // Pour le MVP, on simule la vérification
    
    if (!config.external.infuraProjectId) {
      logger.debug('Infura non configuré, simulation de vérification');
      return false;
    }

    try {
      const provider = new ethers.JsonRpcProvider(
        `https://mainnet.infura.io/v3/${config.external.infuraProjectId}`
      );

      // Vérifier le solde ou les transactions récentes vers l'adresse
      // TODO: Implémenter la vraie vérification

      return false;
    } catch (error) {
      logger.error('Erreur vérification ETH', { error });
      return false;
    }
  }

  /**
   * Vérifier un paiement Bitcoin
   */
  private async verifyBitcoinPayment(_payment: Payment): Promise<boolean> {
    // En production, utiliser une API Bitcoin (BlockCypher, etc.)
    // Pour le MVP, on simule
    return false;
  }

  // ============================================================
  // GESTION DES ABONNEMENTS
  // ============================================================

  /**
   * Activer un abonnement
   */
  private async activateSubscription(
    userId: string,
    plan: SubscriptionPlan,
    paymentId: string
  ): Promise<UserSubscription> {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1); // Abonnement mensuel

    let subscription = this.subscriptions.get(userId);
    
    if (subscription) {
      // Mettre à jour l'abonnement existant
      subscription.plan = plan;
      subscription.startDate = now;
      subscription.endDate = endDate;
      subscription.isActive = true;
      subscription.payments.push(paymentId);
    } else {
      // Créer un nouvel abonnement
      subscription = {
        userId,
        plan,
        startDate: now,
        endDate,
        isActive: true,
        payments: [paymentId],
      };
    }

    this.subscriptions.set(userId, subscription);
    this.saveSubscriptions();

    this.emit('subscription:activated', subscription);
    logger.info(`Abonnement activé: ${userId} -> ${plan}`);

    return subscription;
  }

  /**
   * Obtenir l'abonnement d'un utilisateur
   */
  getSubscription(userId: string): UserSubscription | null {
    const sub = this.subscriptions.get(userId);
    if (!sub) return null;

    // Vérifier si toujours actif
    if (new Date(sub.endDate) < new Date()) {
      sub.isActive = false;
      this.saveSubscriptions();
    }

    return sub;
  }

  /**
   * Vérifier si un utilisateur a accès à une fonctionnalité premium
   */
  hasPremiumAccess(userId: string): boolean {
    const sub = this.getSubscription(userId);
    if (!sub || !sub.isActive) return false;
    return ['basic', 'premium', 'enterprise'].includes(sub.plan);
  }

  /**
   * Obtenir le plan actuel d'un utilisateur
   */
  getCurrentPlan(userId: string): SubscriptionPlan {
    const sub = this.getSubscription(userId);
    if (!sub || !sub.isActive) return 'free';
    return sub.plan;
  }

  /**
   * Obtenir les limites pour un utilisateur
   */
  getUserLimits(userId: string): { maxNodes: number; cloudHosting: boolean } {
    const plan = this.getCurrentPlan(userId);
    const pricing = PRICING_PLANS[plan];
    
    return {
      maxNodes: pricing.maxNodes,
      cloudHosting: pricing.cloudHosting,
    };
  }

  // ============================================================
  // GETTERS PUBLICS
  // ============================================================

  /**
   * Obtenir les plans disponibles
   */
  getAvailablePlans(): PricingPlan[] {
    return Object.values(PRICING_PLANS);
  }

  /**
   * Obtenir les devises supportées
   */
  getSupportedCurrencies(): PaymentCurrency[] {
    return this.paymentAddresses.map(a => a.currency);
  }

  /**
   * Obtenir l'historique des paiements d'un utilisateur
   */
  getPaymentHistory(userId: string): Payment[] {
    return Array.from(this.payments.values())
      .filter(p => p.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Obtenir un paiement par ID
   */
  getPayment(paymentId: string): Payment | null {
    return this.payments.get(paymentId) || null;
  }

  /**
   * Simuler une confirmation de paiement (pour tests/démo)
   */
  async simulatePaymentConfirmation(paymentId: string): Promise<void> {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      throw new Error('Paiement non trouvé');
    }

    if (payment.status !== 'pending') {
      throw new Error('Le paiement n\'est pas en attente');
    }

    payment.status = 'confirmed';
    payment.confirmedAt = new Date();
    payment.txHash = `0x${Buffer.from(Math.random().toString()).toString('hex').slice(0, 64)}`;
    
    this.savePayments();
    await this.activateSubscription(payment.userId, payment.plan, payment.id);
    
    this.emit('payment:confirmed', payment);
    logger.info(`Paiement simulé confirmé: ${paymentId}`);
  }

  // ============================================================
  // CLEANUP
  // ============================================================

  shutdown(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
}

// Singleton
export const paymentManager = new PaymentManager();
export default paymentManager;
