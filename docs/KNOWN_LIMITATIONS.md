# Known limitations

## Ethereum light mode

Ethereum **light mode is not supported** (Geth removed the feature). The orchestrator therefore:

- does not advertise `light` for Ethereum
- does not recommend switching to `light` for Ethereum

If you need a lower disk footprint, use **pruned** mode where supported.
