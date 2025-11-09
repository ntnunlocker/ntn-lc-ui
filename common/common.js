// Load the shared Setup section (HTML fragment) into the current page.
// Usage: loadCommonSetup({ basePath: '../', mountId: 'setupMount' })
// - basePath: path prefix to reach the repo root from this page ('' for root, '../' for pages under lci/ or dsi/)
// - mountId: id of the container where the setup should be injected
window.loadCommonSetup = function loadCommonSetup(opts) {
  const options = opts || {};
  const basePath = options.basePath || '';
  const mountId = options.mountId || 'setupMount';
  const mount = document.getElementById(mountId);
  if (!mount) return Promise.resolve();
  const url = `${basePath}common/setup.html`;
  return fetch(url, { cache: 'no-cache' })
    .then((r) => { if (!r.ok) throw new Error(`Failed to load ${url} (${r.status})`); return r.text(); })
    .then((html) => {
      mount.innerHTML = html;
      try { window.__updateTopDockSpacer && window.__updateTopDockSpacer(); } catch(_) {}
      try { __initCommonSetupHandlers(options); } catch (e) { console.error('Setup init failed:', e); }
    })
    .catch((e) => {
      console.error('Failed to inject Setup:', e);
      mount.innerHTML = '<div class=\"wip-note\">Failed to load shared Setup.</div>';
    });
};

// Load and inject the shared Disclaimer banner and popup, and wire logic.
// Usage: loadCommonDisclaimer({ basePath: '../', topBlockId: 'topBlock', setupMountId: 'setupMount' })
window.loadCommonDisclaimer = function loadCommonDisclaimer(opts) {
  const options = opts || {};
  const basePath = options.basePath || '';
  const topBlockId = options.topBlockId || 'topBlock';
  const setupMountId = options.setupMountId || 'setupMount';
  const topBlock = document.getElementById(topBlockId);
  const url = `${basePath}common/disclaimer.html`;
  if (!topBlock) return Promise.resolve();
  return fetch(url, { cache: 'no-cache' })
    .then((r) => { if (!r.ok) throw new Error(`Failed to load ${url} (${r.status})`); return r.text(); })
    .then((html) => {
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      const banner = tmp.querySelector('#topBanner');
      const overlay = tmp.querySelector('#discOverlay');
      // Insert banner inside topBlock, before setupMount if present
      const setupMount = document.getElementById(setupMountId);
      if (banner) {
        if (setupMount && setupMount.parentElement === topBlock) {
          topBlock.insertBefore(banner, setupMount);
        } else {
          topBlock.appendChild(banner);
        }
      }
      // Overlay goes at end of body
      if (overlay) document.body.appendChild(overlay);
      try { window.__updateTopDockSpacer && window.__updateTopDockSpacer(); } catch {}

      // Wire behavior
      try {
        const disc = document.getElementById('discOverlay');
        const ok = document.getElementById('discOk');
        const bn = document.getElementById('topBanner');
        const closeB = document.getElementById('bannerClose');
        const accepted = (function(){ try { return localStorage.getItem('lcuat_disclaimer_accepted') === '1'; } catch { return false; } })();
        if (!accepted && disc) { disc.style.display = 'block'; }
        if (accepted && bn) { bn.style.display = 'flex'; }
        if (ok) ok.onclick = () => {
          try { localStorage.setItem('lcuat_disclaimer_accepted', '1'); } catch {}
          try { if (disc) disc.style.display = 'none'; } catch {}
          try { if (bn) bn.style.display = 'flex'; } catch {}
          try { window.__updateTopDockSpacer && window.__updateTopDockSpacer(); } catch {}
        };
        if (closeB) closeB.onclick = () => { try { if (bn) bn.style.display = 'none'; } catch {}; try { window.__updateTopDockSpacer && window.__updateTopDockSpacer(); } catch {} };
      } catch {}
    })
    .catch((e) => { console.error('Failed to inject Disclaimer:', e); });
};

// Load the shared Title Controls (currency, FX, decimals, ton toggle) into #pageTitle .unit-controls
// Usage: loadTitleControls({ basePath: '../' })
window.loadTitleControls = function loadTitleControls(opts) {
  const options = opts || {};
  const basePath = options.basePath || '';
  const url = `${basePath}common/title-controls.html`;
  const title = document.getElementById('pageTitle');
  if (!title) return Promise.resolve();
  let host = title.querySelector('.unit-controls');
  if (!host) { host = document.createElement('span'); host.className = 'unit-controls'; title.appendChild(host); }
  return fetch(url, { cache: 'no-cache' })
    .then((r) => { if (!r.ok) throw new Error(`Failed to load ${url} (${r.status})`); return r.text(); })
    .then((html) => {
      host.innerHTML = html;
      // Initialize values from persisted prefs and wire events
      try {
        const sel = document.getElementById('selCurrency');
        const rate = document.getElementById('usdRate');
        const decSel = document.getElementById('decPlaces');
        const chkWei = document.getElementById('chkWei');
        // Settings state (scoped inside loader)
        let displayCurrency = 'NTN';
        let usdPerNTN = 0.9;
        let displayDecPlaces = 7;
        let showWei = false;
        // Helpers
        const clampDec = (n) => Math.max(0, Math.min(18, n|0));
        const applyDisabled = () => {
          try { if (rate) rate.disabled = (displayCurrency !== 'USD'); } catch {}
          try { if (chkWei) chkWei.disabled = (displayCurrency === 'USD'); } catch {}
        };
        const persist = () => {
          try { localStorage.setItem('lcuat_currency', displayCurrency); } catch {}
          try { localStorage.setItem('lcuat_usdRate', String(usdPerNTN)); } catch {}
          try { localStorage.setItem('lcuat_decimals', String(displayDecPlaces)); } catch {}
          try { localStorage.setItem('lcuat_showWei', showWei ? '1' : '0'); } catch {}
        };
        const dispatch = () => {
          const detail = { displayCurrency, usdPerNTN, displayDecPlaces, showWei };
          try { document.dispatchEvent(new CustomEvent('title-controls-change', { detail })); } catch {}
        };
        // Load persisted defaults
        try { const v = localStorage.getItem('lcuat_currency'); if (v) displayCurrency = v; } catch {}
        try { const v = parseFloat(localStorage.getItem('lcuat_usdRate') || '0.9'); if (!isNaN(v)) usdPerNTN = v; } catch {}
        try { const v = parseInt(localStorage.getItem('lcuat_decimals') || '7', 10); if (!isNaN(v)) displayDecPlaces = clampDec(v); } catch {}
        try { const v = localStorage.getItem('lcuat_showWei'); if (v != null) showWei = (v === '1'); } catch {}
        // Apply to DOM
        if (sel) sel.value = displayCurrency;
        if (decSel) decSel.value = String(displayDecPlaces);
        if (rate) {
          const p = clampDec(displayDecPlaces);
          rate.step = String(Math.pow(10, -p));
          rate.value = (Number(usdPerNTN) || 0).toFixed(p);
        }
        if (chkWei) chkWei.checked = !!showWei;
        applyDisabled();
        // Wire events
        if (sel) sel.addEventListener('change', () => {
          displayCurrency = sel.value || 'NTN';
          applyDisabled();
          persist();
          dispatch();
        });
        if (rate) rate.addEventListener('change', () => {
          const p = clampDec(displayDecPlaces);
          const v = parseFloat(rate.value || '0');
          usdPerNTN = isNaN(v) ? 0 : v;
          rate.value = (Number(usdPerNTN) || 0).toFixed(p);
          persist();
          dispatch();
        });
        if (decSel) decSel.addEventListener('change', () => {
          displayDecPlaces = clampDec(parseInt(decSel.value || '7', 10));
          if (rate) {
            const p = clampDec(displayDecPlaces);
            rate.step = String(Math.pow(10, -p));
            rate.value = (Number(usdPerNTN) || 0).toFixed(p);
          }
          persist();
          dispatch();
        });
        if (chkWei) chkWei.addEventListener('change', () => {
          showWei = !!chkWei.checked;
          persist();
          dispatch();
        });
        // Initial dispatch so pages can sync on load
        dispatch();
      } catch {}
      try { window.__updateTopDockSpacer && window.__updateTopDockSpacer(); } catch {}
    })
    .catch((e) => { console.error('Failed to inject Title Controls:', e); });
};

// Global helper to compute sticky offsets for header/banner/setup on any page
;(function setupTopDock(){
  let rafId = 0;
  function measureTopBlock(){
    const tb = document.getElementById('topDock') || document.getElementById('topBlock');
    if (!tb) return 0;
    return tb.offsetHeight || 0;
  }
  function setSpacer(h){
    const sp = document.getElementById('topSpacer');
    if (!sp) return;
    sp.style.height = `${Math.max(0, h)}px`;
    document.documentElement.style.setProperty('--topblock-h', `${Math.max(0, h)}px`);
  }
  function updateTopDockSpacer(){
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(()=>{
      rafId = 0;
      setSpacer(measureTopBlock());
    });
  }
  // Expose for pages to call after banner show/hide, etc.
  window.__updateTopDockSpacer = updateTopDockSpacer;
  // Auto-wire banner close to resize spacer
  document.addEventListener('click', (e)=>{
    const id = (e.target && e.target.id) || '';
    if (id === 'bannerClose' || id === 'discOk') {
      setTimeout(updateTopDockSpacer, 0);
    }
  });
  // Initial run
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateTopDockSpacer, { once: true });
  } else {
    updateTopDockSpacer();
  }
  window.addEventListener('resize', updateTopDockSpacer);
})();

// -------
// Common Setup helpers: dot lights, wallet connect, refresh wiring
// -------

function __setDot(id, status) {
  try {
    const l = document.getElementById(id);
    if (!l) return;
    l.classList.remove('off','green','orange','red');
    if (status === 'green') l.classList.add('green');
    else if (status === 'orange') l.classList.add('orange');
    else if (status === 'red') l.classList.add('red');
    else l.classList.add('off');
  } catch {}
}

// Expose globally so pages can reuse
window.setRpcLight = window.setRpcLight || function setRpcLight(status) { __setDot('rpcLight', status); };
window.setRefreshLight = window.setRefreshLight || function setRefreshLight(status) { __setDot('refreshLight', status); };

function __showSetupError(msg) {
  const s = String(msg || 'Unknown error');
  try { const el = document.getElementById('connInfo'); if (el) el.textContent = s; } catch {}
  if (typeof window.showErrorPopup === 'function') { try { window.showErrorPopup(s); return; } catch {} }
  try { console.error(s); } catch {}
  try { alert(s); } catch {}
}

// Shared wallet connect logic — no network add/switch attempts
window.commonConnectWallet = async function commonConnectWallet() {
  const rpcUrlEl = document.getElementById('rpcUrl');
  const rpcUrl = rpcUrlEl ? (rpcUrlEl.value || '').trim() : '';
  try {
    const injected = (typeof window.detectEthereumProvider !== 'undefined')
      ? await window.detectEthereumProvider()
      : (window.ethereum || null);

    if (!injected && !rpcUrl) {
      __showSetupError('No wallet detected and no RPC URL set.');
      window.setRpcLight && window.setRpcLight('red');
      return;
    }

    // Prepare readProvider from RPC if ethers is available
    if (rpcUrl && window.ethers && window.ethers.providers) {
      try { window.readProvider = new window.ethers.providers.JsonRpcProvider(rpcUrl); } catch {}
    }

    if (injected) {
      // Use ethers if available to get signer; otherwise keep raw provider
      if (window.ethers && window.ethers.providers) {
        window.provider = new window.ethers.providers.Web3Provider(injected, 'any');
      } else {
        window.provider = injected;
      }
      let accounts = [];
      try {
        accounts = await injected.request({ method: 'eth_requestAccounts' });
      } catch (e) {
        __showSetupError('Wallet connection failed: ' + (e && e.message ? e.message : e));
        window.setRpcLight && window.setRpcLight('red');
        return;
      }
      if (!accounts || accounts.length === 0) {
        __showSetupError('Wallet connected with no accounts. Please unlock and try again.');
        window.setRpcLight && window.setRpcLight('red');
        return;
      }
      try {
        if (window.ethers && window.provider && window.provider.getSigner) {
          window.signer = window.provider.getSigner();
          try { window.userAddr = await window.signer.getAddress(); } catch { window.userAddr = accounts[0]; }
        } else {
          window.signer = null; window.userAddr = accounts[0];
        }
      } catch { window.signer = null; window.userAddr = accounts[0]; }

      try { const uEl = document.getElementById('connUser'); if (uEl) uEl.textContent = window.userAddr || '(none)'; } catch {}
      try { const dot = document.getElementById('connAccountDot'); if (dot) dot.classList.remove('off'); } catch {}
      try { const sw = document.getElementById('connSendWarn'); if (sw) sw.style.display = 'none'; } catch {}
      try { const infoEl = document.getElementById('connInfo'); if (infoEl) infoEl.textContent = ''; } catch {}
      window.setRpcLight && window.setRpcLight('green');
      return;
    }

    // Fallback: read-only via RPC
    if (rpcUrl && window.ethers && window.ethers.providers) {
      window.provider = new window.ethers.providers.JsonRpcProvider(rpcUrl);
      window.readProvider = window.provider;
      window.signer = null;
      window.userAddr = '(read-only)';
      try { const uEl = document.getElementById('connUser'); if (uEl) uEl.textContent = window.userAddr; } catch {}
      try { const dot = document.getElementById('connAccountDot'); if (dot) dot.classList.add('off'); } catch {}
      try { const sw = document.getElementById('connSendWarn'); if (sw) sw.style.display = 'block'; } catch {}
      window.setRpcLight && window.setRpcLight('green');
      try { const span = document.getElementById('connUser'); if (span) span.style.display = ''; } catch {}
      return;
    }
  } catch (e) {
    __showSetupError('Provider connection failed: ' + (e && e.message ? e.message : e));
    window.setRpcLight && window.setRpcLight('red');
  }
};
// Use commonConnectWallet across pages.

// Shared Refresh wiring; calls page hooks if present
window.commonSetupRefresh = async function commonSetupRefresh() {
  try { window.setRefreshLight && window.setRefreshLight('orange'); } catch {}
  try { window.setRpcLight && window.setRpcLight('orange'); } catch {}
  try {
    if (typeof window.onSetupRefresh === 'function') {
      await window.onSetupRefresh();
    } else if (typeof window.fetchState === 'function') {
      await window.fetchState(true);
      if (typeof window.buildMethodsUI === 'function') { try { await window.buildMethodsUI(); } catch {} }
    }
    try { window.setRefreshLight && window.setRefreshLight('green'); } catch {}
    try { window.setRpcLight && window.setRpcLight('green'); } catch {}
  } catch (e) {
    __showSetupError('Refresh failed: ' + (e && e.message ? e.message : e));
    try { window.setRefreshLight && window.setRefreshLight('red'); } catch {}
    try { window.setRpcLight && window.setRpcLight('red'); } catch {}
  }
};
// Back-compat alias for pages expecting a named refresh action
if (typeof window.refreshSetup !== 'function') { try { window.refreshSetup = window.commonSetupRefresh; } catch {} }

function __initCommonSetupHandlers(options) {
  // Persist and apply RPC URL; also wire select -> input
  try {
    const rpcSel = document.getElementById('rpcSel');
    const rpcEl = document.getElementById('rpcUrl');
    const applyRpcValue = (url) => { try { if (rpcEl) rpcEl.value = url; } catch {} };
    const saved = (function(){ try { return localStorage.getItem('lcuat_rpcUrl') || ''; } catch { return ''; }})();
    if (rpcEl) { if (saved) applyRpcValue(saved); }
    if (rpcSel) {
      rpcSel.addEventListener('change', () => {
        const v = rpcSel.value;
        if (v && v !== 'custom') {
          applyRpcValue(v);
          rpcEl && rpcEl.dispatchEvent(new Event('change'));
        } else if (v === 'custom') {
          try {
            if (rpcEl) {
              rpcEl.value = '';
              rpcEl.dispatchEvent(new Event('change'));
              rpcEl.focus();
            }
          } catch {}
        }
      });
    }
    if (rpcEl) {
      rpcEl.addEventListener('change', () => {
        const url = (rpcEl.value || '').trim();
        try { localStorage.setItem('lcuat_rpcUrl', url); } catch {}
        if (url && window.ethers && window.ethers.providers) {
          try { window.readProvider = new window.ethers.providers.JsonRpcProvider(url); } catch {}
        } else { try { window.readProvider = null; } catch {} }
        if (typeof window.onRpcUrlChanged === 'function') { try { window.onRpcUrlChanged(url); } catch {} }
      });
    }
  } catch {}

  // Buttons: Connect / Load
  try { const c = document.getElementById('btnConnect'); if (c) c.onclick = () => window.commonConnectWallet(); } catch {}
  try { const l = document.getElementById('btnLoad'); if (l) l.onclick = () => window.commonSetupRefresh(); } catch {}
  try {
    const m = document.getElementById('btnAccManage');
    if (m) {
      m.onclick = null;
      m.addEventListener('click', (e) => { e.preventDefault(); try { window.commonSwitchAccount && window.commonSwitchAccount(); } catch (err) { console.error(err); } });
    }
  } catch {}
}

// Open wallet account picker and refresh connection
window.commonSwitchAccount = async function commonSwitchAccount() {
  try {
    const injected = (typeof window.detectEthereumProvider !== 'undefined')
      ? await window.detectEthereumProvider()
      : (window.ethereum || null);
    if (!injected) { __showSetupError('No wallet detected.'); return; }
    try {
      // No tip message; rely on MetaMask UI for account selection
      await injected.request({ method: 'wallet_requestPermissions', params: [ { eth_accounts: {} } ] });
      try { await injected.request({ method: 'eth_requestAccounts' }); } catch {}
    } catch (e) {
      __showSetupError('Account selection canceled: ' + (e && e.message ? e.message : e));
      return;
    }
    // Refresh connection state after selection
    try {
      await window.commonConnectWallet();
    } catch {}
  } catch (e) {
    __showSetupError('Failed to switch account: ' + (e && e.message ? e.message : e));
  }
};

// No Account dropdown; rely on MetaMask account switching and accountsChanged events
