require('dotenv').config();
const express = require('express');
const path    = require('path');
const axios   = require('axios');
const app     = express();

const {
  BASESCAN_API_KEY,
  TARGET_WALLET,
  TARGET_ETH,
  PORT = 4000
} = process.env;

// helper: wei → ETH
const weiToEth = wei => Number(wei) / 1e18;

// ─── API ROUTE ───────────────────────────────────────────────────────────────
app.get('/api/contributions', async (req, res, next) => {
  try {
    const { data } = await axios.get('https://api.basescan.org/api', {
      params: {
        module:     'account',
        action:     'txlist',
        address:    TARGET_WALLET,
        startblock: 0,
        endblock:   99999999,
        sort:       'asc',
        apikey:     BASESCAN_API_KEY
      }
    });

    if (data.status !== '1') {
      return res.status(500).json({ error: data.message });
    }

    // filter only incoming successful ETH transfers
    const incoming = data.result.filter(tx =>
      tx.to.toLowerCase() === TARGET_WALLET.toLowerCase() &&
      tx.isError === '0'
    );

    // aggregate by sender
    const bySender = {};
    incoming.forEach(tx => {
      const amt = weiToEth(tx.value);
      bySender[tx.from] = (bySender[tx.from] || 0) + amt;
    });

    const totalReceived = Object.values(bySender).reduce((a, b) => a + b, 0);
    const target = Number(TARGET_ETH);
    const contributions = Object.entries(bySender).map(
      ([address, amount]) => ({
        address,
        amount:     parseFloat(amount.toFixed(6)),
        percentage: parseFloat(((amount / target) * 100).toFixed(2))
      })
    );

    res.json({ totalReceived, target, contributions });
  } catch (err) {
    next(err);
  }
});

// ─── SERVE REACT IN PRODUCTION ───────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  // static assets from React build
  app.use(
    express.static(
      path.join(__dirname, 'eth-crowdfund-ui', 'build')
    )
  );
  // all other GETs go to React's index.html
  app.get('*', (req, res) => {
    res.sendFile(
      path.join(__dirname, 'eth-crowdfund-ui', 'build', 'index.html')
    );
  });
}

// ─── ERROR HANDLER (LAST) ───────────────────────────────────────────────────
app.use((err, req, res, next) =>
  res.status(500).json({ error: err.message })
);

// ─── START SERVER ───────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () =>
  console.log(`Server listening on port ${PORT}`)
);
