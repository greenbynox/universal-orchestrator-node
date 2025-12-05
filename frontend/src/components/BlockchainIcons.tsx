import React from 'react';

// SVG Icons for major blockchains
// These are simplified vector representations for UI purposes

interface IconProps {
  className?: string;
  size?: number;
}

export const BitcoinIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#F7931A"/>
    <path d="M22.5 14.1c.3-2-1.2-3.1-3.3-3.8l.7-2.7-1.6-.4-.7 2.6c-.4-.1-.8-.2-1.3-.3l.7-2.7-1.6-.4-.7 2.7c-.4-.1-.7-.2-1-.3l-2.2-.5-.4 1.7s1.2.3 1.2.3c.7.2.8.6.8 1l-.8 3.2c0 0 .1 0 .2.1l-.2-.1-1.1 4.5c-.1.2-.3.5-.8.4 0 0-1.2-.3-1.2-.3L8 20.1l2.1.5c.4.1.8.2 1.2.3l-.7 2.8 1.6.4.7-2.7c.4.1.9.2 1.3.3l-.7 2.7 1.6.4.7-2.8c2.8.5 4.9.3 5.8-2.2.7-2-.1-3.2-1.5-3.9 1.1-.2 1.9-1 2.1-2.5zm-3.8 5.3c-.5 2-3.9.9-5 .7l.9-3.6c1.1.3 4.7.8 4.1 2.9zm.5-5.4c-.5 1.8-3.3.9-4.2.7l.8-3.2c.9.2 3.9.6 3.4 2.5z" fill="white"/>
  </svg>
);

export const EthereumIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#627EEA"/>
    <path d="M16 4l-.2.6v15.7l.2.2 7.3-4.3L16 4z" fill="white" fillOpacity="0.6"/>
    <path d="M16 4L8.7 16.2l7.3 4.3V4z" fill="white"/>
    <path d="M16 22.1l-.1.1v5.6l.1.2 7.3-10.3-7.3 4.4z" fill="white" fillOpacity="0.6"/>
    <path d="M16 28v-5.9l-7.3-4.4L16 28z" fill="white"/>
    <path d="M16 20.5l7.3-4.3L16 12v8.5z" fill="white" fillOpacity="0.2"/>
    <path d="M8.7 16.2l7.3 4.3V12l-7.3 4.2z" fill="white" fillOpacity="0.6"/>
  </svg>
);

export const SolanaIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#000"/>
    <defs>
      <linearGradient id="solana-grad" x1="7" y1="25" x2="25" y2="7">
        <stop offset="0%" stopColor="#00FFA3"/>
        <stop offset="100%" stopColor="#DC1FFF"/>
      </linearGradient>
    </defs>
    <path d="M9.5 19.5l2-2h12l-2 2h-12zm0-5l2-2h12l-2 2h-12zm12 10l-2 2h-12l2-2h12z" fill="url(#solana-grad)" stroke="url(#solana-grad)" strokeWidth="1"/>
  </svg>
);

export const BNBIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#F3BA2F"/>
    <path d="M12.1 14.1L16 10.2l3.9 3.9 2.3-2.3L16 5.6l-6.2 6.2 2.3 2.3zm-6.5 1.9l2.3-2.3 2.3 2.3-2.3 2.3-2.3-2.3zm6.5 1.9L16 21.8l3.9-3.9 2.3 2.3-6.2 6.2-6.2-6.2 2.3-2.3zm10.4-1.9l-2.3 2.3-2.3-2.3 2.3-2.3 2.3 2.3zM18.5 16L16 13.5 13.5 16 16 18.5 18.5 16z" fill="white"/>
  </svg>
);

export const MoneroIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#FF6600"/>
    <path d="M16 6.5l-8 10v6.5h4v-4.5l4-5 4 5v4.5h4v-6.5l-8-10z" fill="white"/>
    <path d="M6 21h4v2H6v-2zm16 0h4v2h-4v-2z" fill="white"/>
  </svg>
);

export const CardanoIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#0033AD"/>
    <circle cx="16" cy="16" r="3" fill="white"/>
    <circle cx="16" cy="8" r="1.5" fill="white"/>
    <circle cx="16" cy="24" r="1.5" fill="white"/>
    <circle cx="9" cy="12" r="1.5" fill="white"/>
    <circle cx="23" cy="12" r="1.5" fill="white"/>
    <circle cx="9" cy="20" r="1.5" fill="white"/>
    <circle cx="23" cy="20" r="1.5" fill="white"/>
  </svg>
);

export const PolkadotIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#E6007A"/>
    <circle cx="16" cy="10" r="4" fill="white"/>
    <circle cx="16" cy="22" r="4" fill="white"/>
    <ellipse cx="16" cy="16" rx="6" ry="2" fill="white"/>
  </svg>
);

export const AvalancheIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#E84142"/>
    <path d="M21.5 21H18l-2-3.5-2 3.5h-3.5L16 12l5.5 9z" fill="white"/>
    <path d="M11 21H8l4-7 1.5 2.5L11 21z" fill="white"/>
  </svg>
);

export const PolygonIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#8247E5"/>
    <path d="M21 13l-3-1.7v3.4L21 13zm-3 6.3v3.4l3-1.7-3-1.7zm-2-4.6l-3 1.7 3 1.7 3-1.7-3-1.7zm-5 0v3.4l3 1.7v-3.4l-3-1.7zm5-4.6L13 12l3 1.7 3-1.7-3-1.7v-.3z" fill="white"/>
  </svg>
);

export const CosmosIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#2E3148"/>
    <circle cx="16" cy="16" r="3" fill="white"/>
    <ellipse cx="16" cy="16" rx="10" ry="4" stroke="white" strokeWidth="1.5" fill="none"/>
    <ellipse cx="16" cy="16" rx="10" ry="4" stroke="white" strokeWidth="1.5" fill="none" transform="rotate(60 16 16)"/>
    <ellipse cx="16" cy="16" rx="10" ry="4" stroke="white" strokeWidth="1.5" fill="none" transform="rotate(-60 16 16)"/>
  </svg>
);

export const ArbitrumIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#28A0F0"/>
    <path d="M16 8l6 10-6 6-6-6 6-10z" fill="white"/>
    <path d="M16 8l6 10-6-4V8z" fill="white" fillOpacity="0.5"/>
  </svg>
);

export const OptimismIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#FF0420"/>
    <circle cx="12" cy="16" r="4" fill="white"/>
    <path d="M19 12h2c2 0 3.5 1.5 3.5 4s-1.5 4-3.5 4h-2v-8z" fill="white"/>
  </svg>
);

export const XRPIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#23292F"/>
    <path d="M10 10h2.5l3.5 4.5 3.5-4.5H22l-5 6 5 6h-2.5l-3.5-4.5-3.5 4.5H10l5-6-5-6z" fill="white"/>
  </svg>
);

export const LitecoinIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#BFBBBB"/>
    <path d="M12 22h10v-2H15l5-12h-3l-4 10-2 1v2l1-1v2z" fill="white"/>
    <path d="M10 17l6-2 .5 1.5-6 2-.5-1.5z" fill="white"/>
  </svg>
);

export const DogecoinIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#C2A633"/>
    <path d="M12 10h4c4 0 6 2.5 6 6s-2 6-6 6h-4v-12zm3 3v6h1c2 0 3-1.2 3-3s-1-3-3-3h-1z" fill="white"/>
    <path d="M10 15h8v2h-8v-2z" fill="white"/>
  </svg>
);

export const ChainlinkIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#375BD2"/>
    <path d="M16 7l-7 4v10l7 4 7-4V11l-7-4zm0 2.3l4.7 2.7v5.4L16 20l-4.7-2.6V12l4.7-2.7z" fill="white"/>
  </svg>
);

export const UniswapIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#FF007A"/>
    <path d="M14 10c-2 0-3.5 1-4 2.5s0 3 1.5 4c-2 .5-3 2-2.5 3.5s2 2.5 4 2.5c1.5 0 3-.5 4-1.5 1 1 2.5 1.5 4 1.5 2 0 3.5-1 4-2.5s0-3-1.5-4c2-.5 3-2 2.5-3.5s-2-2.5-4-2.5c-1.5 0-3 .5-4 1.5-1-1-2.5-1.5-4-1.5z" fill="white"/>
  </svg>
);

export const TronIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#FF0013"/>
    <path d="M8 10l16 2-10 12L8 10z" fill="white"/>
    <path d="M8 10l8 3 8-1-8-3-8 1z" fill="white" fillOpacity="0.7"/>
  </svg>
);

export const StellarIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#14B6E7"/>
    <path d="M8 11l16 6-2 2L8 13v-2zm0 8l16-6v2l-14 6-2-2z" fill="white"/>
  </svg>
);

export const TezosIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#2C7DF7"/>
    <path d="M19 9h-6v3h-2v5h2v3c0 2 1.5 3.5 3.5 3.5S20 22 20 20h-2.5c0 .5-.5 1-1 1s-1-.5-1-1v-3h4v-5h-4V11h3.5l1-2z" fill="white"/>
  </svg>
);

export const NEARIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#00C08B"/>
    <path d="M11 22V10l5 6 5-6v12l-3-4v5l-2-2.5-2 2.5v-5l-3 4z" fill="white"/>
  </svg>
);

export const AlgorandIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#000000"/>
    <path d="M12 22l2-5h4l1 5h2l-1-5h2l-.5-2h-2l-1-4h-2l1 4h-3l1-4h-2l-1 4h-2l.5 2h2l-2 5h2z" fill="white"/>
  </svg>
);

export const TONIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#0098EA"/>
    <path d="M8 12h16l-8 12-8-12z" fill="white"/>
    <path d="M8 12h16v2H8v-2z" fill="white" fillOpacity="0.5"/>
  </svg>
);

export const SuiIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#6FBCF0"/>
    <path d="M16 8c-5 0-8 4-8 8s3 8 8 8 8-4 8-8-3-8-8-8zm0 12c-2 0-4-1.5-4-4s2-4 4-4 4 1.5 4 4-2 4-4 4z" fill="white"/>
  </svg>
);

export const AptosIcon: React.FC<IconProps> = ({ className = '', size = 24 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="16" fill="#4CD7D0"/>
    <path d="M10 18h5v2h-5v-2zm0-4h8v2h-8v-2zm2-4h10v2H12v-2zm5 12h5v2h-5v-2z" fill="white"/>
  </svg>
);

// Map of blockchain IDs to their SVG icons
export const BLOCKCHAIN_SVG_ICONS: Record<string, React.FC<IconProps>> = {
  bitcoin: BitcoinIcon,
  ethereum: EthereumIcon,
  solana: SolanaIcon,
  bnb: BNBIcon,
  monero: MoneroIcon,
  cardano: CardanoIcon,
  polkadot: PolkadotIcon,
  avalanche: AvalancheIcon,
  polygon: PolygonIcon,
  cosmos: CosmosIcon,
  arbitrum: ArbitrumIcon,
  optimism: OptimismIcon,
  xrp: XRPIcon,
  litecoin: LitecoinIcon,
  dogecoin: DogecoinIcon,
  chainlink: ChainlinkIcon,
  uniswap: UniswapIcon,
  tron: TronIcon,
  stellar: StellarIcon,
  tezos: TezosIcon,
  near: NEARIcon,
  algorand: AlgorandIcon,
  ton: TONIcon,
  sui: SuiIcon,
  aptos: AptosIcon,
};

// Get icon component for a blockchain
export function getBlockchainIcon(blockchainId: string): React.FC<IconProps> | null {
  return BLOCKCHAIN_SVG_ICONS[blockchainId] || null;
}

// Render blockchain icon with fallback to emoji
export const BlockchainIcon: React.FC<{
  blockchainId: string;
  fallbackEmoji?: string;
  size?: number;
  className?: string;
}> = ({ blockchainId, fallbackEmoji = '🔗', size = 24, className = '' }) => {
  const IconComponent = BLOCKCHAIN_SVG_ICONS[blockchainId];
  
  if (IconComponent) {
    return <IconComponent size={size} className={className} />;
  }
  
  return (
    <span 
      className={className} 
      style={{ fontSize: size * 0.8, lineHeight: 1 }}
    >
      {fallbackEmoji}
    </span>
  );
};

export default BlockchainIcon;
