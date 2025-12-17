# Release notes — v2.3.0

## Highlights

- **Stabilité WSL2/Docker** : meilleure détection de l’hôte Docker (WSL2 TCP) et résilience aux redémarrages.
- **Vérité terrain sur les modes** : le backend expose désormais ce qui est réellement supporté (ex: **Ethereum `light` désactivé**).
- **Moins de bruit en dev** : Socket.IO évite le proxy WS de Vite en se connectant directement au backend en mode développement.
- **Sécurité** : API auth fail-closed (prod), CORS WS aligné, redaction de configs sensibles.

## Changements importants

### Ethereum : suppression du mode `light`
Geth ne supporte plus le mode light. L’orchestrateur :
- n’affiche plus `light` comme option pour Ethereum,
- ne recommande plus “Essayez le mode light…” pour Ethereum.

### WebSocket en dev
En dev, le frontend peut se connecter directement au backend via :
- `VITE_BACKEND_HOST`
- `VITE_BACKEND_PORT`

Voir `frontend/.env.example`.

## Artifacts
Les binaires (Windows/Linux/macOS) sont produits par GitHub Actions lors d’un tag `v*`.

- Windows: `.exe`
- Linux: `.AppImage`, `.deb`, `.tar.gz` (x64 + arm64)
- macOS: `.dmg`, `.zip` (x64 + arm64)

## Quick checklist (maintainers)

- [ ] `npm test`
- [ ] `npm run build`
- [ ] Tag `v2.3.0` + push
- [ ] Vérifier la release (assets + SHA256)
