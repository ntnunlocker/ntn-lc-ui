# Newton Stake Token Locking Contract Interface

Newton Stake Token Locking Contract Interface (LCI) — a lightweight browser UI to help _Beneficiaries_ of NTN stake token locking contracts (e.g. on Autonity Mainnet) to view and manage their contracts locally. It serves static HTML pages that you can open from a simple local web server. MetaMask integration is optional and only needed to send transactions.

## What This Is

- **Purpose:** Browse Locking Contracts (LCs), inspect state, compute accounting, and optionally send transactions via MetaMask.
- **How it runs:** Pure static HTML/JS pages loaded from a local server — no backend.
- **Status:** Currently, only the Locking Contract Interface dashboard is functional. Other views are work‑in‑progress shells that share the common setup and theme.

## Quick Start

- **Requirements:**
  - A recent browser (tested on Linux + Chrome + MetaMask)
  - Python 3 for a simple local server
  - MetaMask (only required for sending txs)

- **Start a local server:**
  - Linux/macOS/Windows (PowerShell or CMD)
    - `python3 -m http.server 8000`
    - or `python -m http.server 8000` (if `python` points to Python 3)
  - Then open: `http://localhost:8000/lci/lc-dashboard.html`

- **Notes:**
  - The app is designed for use from an `http://` origin; opening the HTML files directly via `file://` can break wallet access and cross‑file loading.
  - Tested only on Linux + Chrome + MetaMask. Other environments may work but are untested.

## Navigating The Pages

- `lci/lc-dashboard.html`: Locking Contract Interface (LCI) dashboard. This is the main, functional view today.
- `lci/consolidate-view.html`: Global view of a list of LCs and their consolidated exposure (across selected LCs) to each validator. WIP.
- `dsi/delegator-dashboard.html`: Delegated Staking Interface (DSI) view focused on delegator EOA accounts. WIP.
- `dsi/consolidate-view.html`: Consolidated view for a set of delegator‑selected accounts to stake straightforwardly. WIP.
- `pf-view.html`: Portfolio view consolidating both LC and delegator exposures. WIP.

All non‑final pages currently share the common setup (RPC, wallet connection, protocol info) and theme. Their core functionality is intentionally not implemented yet.

Note: Files under `common/` such as `common/setup.html`, `common/disclaimer.html`, and `common/title-controls.html` are shared HTML fragments included by the pages above. They are not standalone pages and should not be opened directly in the browser.

## ABIs & Overrides

- The dashboard embeds minimal default ABIs for `LockingContract`, `Autonity/IAutonity`, and `ILiquid` from public sources (see References).
- You can override these by either pasting JSON into the ABI textareas or by selecting local ABI files from the “ABIs” section. Overrides are in‑memory and apply only to the current browser tab; reloading restores the defaults.

## Data & Common Assets

- `common/local-data.json`: Stores locally added LC addresses and delegator accounts (LC beneficiaries are added automatically when applicable).
- `common/style.css`: Shared theme and base styles.
- `common/setup.html`: Shared “Setup” section (RPC endpoint, protocol config, wallet, validators panel). On first load, the RPC defaults to the first MainNet endpoint. This is an include‑only fragment; do not open directly.
- `common/common.js`: Helper to inject the shared setup into each page.
- `common/disclaimer.html`: Shared disclaimer banner and first‑use popup. Include‑only fragment; do not open directly.
- `common/title-controls.html`: Shared title controls (Currency, USD FX rate, Decimals, ton toggle). Include‑only fragment; do not open directly.
- `sc/abi/`: Contract ABIs used by the UI.

## MetaMask & Transactions

- You can browse read‑only data with just an RPC endpoint.
- To send transactions, connect MetaMask from the Setup section (“Connect Wallet”).
- Make sure the selected network in MetaMask matches the RPC in the Setup.
- MetaMask support: [How to add a custom network RPC](https://support.metamask.io/configure/networks/how-to-add-a-custom-network-rpc/)

## Disclaimer

This project is a community‑developed tool intended solely for development, visualization, and testing. It is provided strictly on an “AS IS” and “AS AVAILABLE” basis, without any warranties of any kind (express or implied), including but not limited to warranties of merchantability, fitness for a particular purpose, non‑infringement, accuracy, or availability. The tool has not been independently audited, validated, or certified, and may contain defects, vulnerabilities, or inaccuracies. By using this tool, you acknowledge you do so entirely at your own risk and assume full responsibility for any loss or damage. Do not use this tool for production, financial decisions, or with real funds. Always verify results independently.

See the in‑page disclaimer in `lci/lc-dashboard.html` for the same terms.

## References

- Documentation: NTN Locking Contracts — specs and method explanations
  - https://autonity.github.io/ntn-locking-contracts/
- ABI Sources (public):
  - Autonity protocol contract ABIs (v1.1.2): https://github.com/autonity/autonity/releases/download/v1.1.2/protocol-contracts-abi-1.1.2.tar.gz
  - LockingContract verified source/ABI (Mainnet): https://autonityscan.org/address/0x086d6aBD9b884CF8FECa1f82132300abae5D6677?tab=contract

Only the ABIs required by the dashboard are kept in `sc/abi/` (LockingContract, IAutonity/Autonity, ILiquid). Other ABIs were removed to avoid confusion and ensure all artifacts come from public sources.

## License

MIT — see `LICENSE`.
