// index.js
require('dotenv').config();
delete process.env.DEBUG;    // ensure DEBUG isn’t picked up by path-to-regexp

const express = require('express');
const axios   = require('axios');
const path    = require('path');
const app     = express();

const {
  BASESCAN_API_KEY,
  TARGET_WALLET,
  TARGET_ETH,
  TOKEN_CONTRACT,
  TOKEN_GOAL,
  NODE_ENV,
  PORT = 4000
} = process.env;

// sanity‐check .env
if (!BASESCAN_API_KEY || BASESCAN_API_KEY === '-') {
  console.error('❌ Please set BASESCAN_API_KEY in your .env');
  process.exit(1);
}
if (!TARGET_WALLET || !TARGET_ETH) {
  console.error('❌ Please set TARGET_WALLET and TARGET_ETH in your .env');
  process.exit(1);
}
if (!TOKEN_CONTRACT || !TOKEN_GOAL) {
  console.error('❌ Please set TOKEN_CONTRACT and TOKEN_GOAL in your .env');
  process.exit(1);
}

// helpers
const weiToEth   = (wei) => Number(wei) / 1e18;
const rawToToken = (raw, dec) => Number(raw) / Math.pow(10, Number(dec));

// ── 1) ETH contributions endpoint ────────────────────────────────────────
app.get('/api/contributions', async (req, res) => {
  try {
    const { data } = await axios.get('https://api.basescan.org/api', {
      params: {
        module:     'account',
        action:     'txlist',
        address:    TARGET_WALLET,
        startblock: 0,
        endblock:   99999999,
        sort:       'asc',
        apikey:     BASESCAN_API_KEY,
      }
    });
    if (data.status !== '1') {
      return res.json({
        totalReceived: 0,
        target:        Number(TARGET_ETH),
        contributions: []
      });
    }
    const incoming = data.result.filter(
      tx => tx.to.toLowerCase() === TARGET_WALLET.toLowerCase() && tx.isError === '0'
    );
    const bySender = {};
    incoming.forEach(tx => {
      const eth = weiToEth(tx.value);
      const from = tx.from.toLowerCase();
      bySender[from] = (bySender[from] || 0) + eth;
    });
    const totalReceived = Object.values(bySender).reduce((a, b) => a + b, 0);
    const target        = Number(TARGET_ETH);
    const contributions = Object.entries(bySender).map(([address, amount]) => ({
      address,
      amount:     parseFloat(amount.toFixed(4)),
      percentage: parseFloat(((amount / target) * 100).toFixed(2))
    }));
    res.json({ totalReceived, target, contributions });
  } catch (e) {
    console.error('[/api/contributions] error:', e.message);
    res.json({
      totalReceived: 0,
      target:        Number(TARGET_ETH),
      contributions: []
    });
  }
});

// ── 2) ERC-20 token collection endpoint ────────────────────────────────
app.get('/api/token-collection', async (req, res) => {
  try {
    const { data } = await axios.get('https://api.basescan.org/api', {
      params: {
        module:          'account',
        action:          'tokentx',
        contractaddress: TOKEN_CONTRACT,
        address:         TARGET_WALLET,
        sort:            'asc',
        apikey:          BASESCAN_API_KEY,
      }
    });
    if (data.status !== '1') {
      return res.json({
        collected:    0,
        goal:         Number(TOKEN_GOAL),
        contributions:[]
      });
    }
    const transfers = data.result
      .filter(tx => tx.to.toLowerCase() === TARGET_WALLET.toLowerCase() && tx.tokenDecimal)
      .map(tx => ({
        from:   tx.from.toLowerCase(),
        amount: rawToToken(tx.value, tx.tokenDecimal)
      }));
    const bySender = {};
    transfers.forEach(({ from, amount }) => {
      bySender[from] = (bySender[from] || 0) + amount;
    });
    const collected     = Object.values(bySender).reduce((a,b) => a+b, 0);
    const goal          = Number(TOKEN_GOAL);
    const contributions = Object.entries(bySender).map(([address, amount]) => ({
      address,
      amount:     parseFloat(amount.toFixed(2)),
      percentage: parseFloat(((amount / goal) * 100).toFixed(2))
    }));
    res.json({ collected, goal, contributions });
  } catch (e) {
    console.error('[/api/token-collection] error:', e.response?.data || e.message);
    res.json({
      collected:    0,
      goal:         Number(TOKEN_GOAL),
      contributions:[]
    });
  }
});

// ── 3) Serve React build in production ─────────────────────────────────
if (NODE_ENV === 'production') {
  const buildDir = path.join(__dirname, 'eth-crowdfund-ui', 'build');
  app.use(express.static(buildDir));
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(buildDir, 'index.html'));
  });
}

// ── 4) Start server ────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Listening on port ${PORT} (${NODE_ENV})`);
});
