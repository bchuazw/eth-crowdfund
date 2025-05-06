// src/App.js

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import './App.css';

export default function App() {
  const [ethData, setEthData] = useState(null);
  const [tokData, setTokData] = useState(null);

  // map lowercase addresses → friendly names
  const nameMap = {
    '0x14eedac0c9cc20bc189cc144908a1221ad048401': 'Turtleneck87',
    '0x5efd95ced49055f9f2d945a459debfccee33aa54': 'daniel_sats',
    '0xda17f59941a8548994ba6059eadf555f3497df42': "SAmaz'ng",
    '0xc2125c2689dcabbcb6afb2cfa84f46e762cb464b': 'Estrid',
    '0x6e13a1ebf67d41a6f8c951d748c6a27771f6804b': 'taylor3103',
  };

  // fetch ETH & token data
  const fetchEth = async () => {
    try {
      const res = await axios.get('/api/contributions');
      setEthData(res.data);
    } catch (err) {
      console.error('Error fetching ETH:', err);
    }
  };
  const fetchTok = async () => {
    try {
      const res = await axios.get('/api/token-collection');
      setTokData(res.data);
    } catch (err) {
      console.error('Error fetching tokens:', err);
    }
  };

  useEffect(() => {
    fetchEth();
    fetchTok();
    const eI = setInterval(fetchEth, 15000);
    const tI = setInterval(fetchTok, 15000);
    return () => {
      clearInterval(eI);
      clearInterval(tI);
    };
  }, []);

  if (!ethData || !tokData) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>Loading…</p>
      </div>
    );
  }

  // unpack ETH
  const { totalReceived, target, contributions } = ethData;
  const ethPct = Math.min((totalReceived / target) * 100, 100);

  // unpack Token ($MAXX)
  const { collected: tokCollected, goal: tokGoal, contributions: tokContribs } = tokData;
  const tokPct = Math.min((tokCollected / tokGoal) * 100, 100);

  // prepare chart data
  const ethLabels  = contributions.map(c => c.address.slice(0,6) + '…');
  const ethValues  = contributions.map(c => c.percentage);

  const tokLabels  = tokContribs.map(c => c.address.slice(0,6) + '…');
  const tokValues  = tokContribs.map(c => c.percentage);

  return (
    <div className="outer-wrapper">
      {/* left bear */}
      <div className="bear-side">
        <img src="/bear.png" alt="Bear" />
      </div>

      <div className="app-wrapper">
        <div className="card">
          {/* ETH Header */}
          <div className="header">
            <h2>🎯 ETH Goal: <span>{target} ETH</span></h2>
            <h3>🚀 Collected: <span>{totalReceived.toFixed(4)} ETH</span></h3>
          </div>
          <div className="progress-container">
            <div
              className="rocket-container"
              style={{ left: `calc(${ethPct}% - 1.5rem)` }}
            >
              <img
                src="/rocket.png"
                alt="Rocket"
                className="rocket-img"
              />
            </div>
            <progress
              className="progress-bar"
              value={totalReceived}
              max={target}
              style={{ '--pct': `${ethPct}%` }}
            />
          </div>

          {/* ETH Pie & List */}
          <div className="content">
            <div className="pie-section">
              <Pie
                data={{
                  labels: ethLabels,
                  datasets: [{ data: ethValues }]
                }}
                options={{
                  plugins: {
                    legend:  { position: 'bottom', labels: { padding: 12 } },
                    tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed}%` } }
                  },
                  maintainAspectRatio: false
                }}
              />
            </div>
            <ul className="list-section">
              {contributions.map(c => {
                const lc   = c.address.toLowerCase();
                const name = nameMap[lc];
                return (
                  <li key={lc}>
                    <div className="addr-block">
                      {name && <span className="name">{name}</span>}
                      <span className="address-small">
                        {lc.slice(0,5)}…{lc.slice(-5)}
                      </span>
                    </div>
                    <span className="amt">
                      {c.amount.toFixed(4)} ETH <em>({c.percentage}%)</em>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* $MAXX Header */}
          <div style={{ marginTop: '40px' }} className="header token">
            <h2>🎯 $MAXX Goal: <span>{tokGoal}</span></h2>
            <h3>🚀 Collected: <span>{tokCollected.toFixed(2)}</span></h3>
          </div>
          <div className="progress-container token">
            <div
              className="rocket-container"
              style={{ left: `calc(${tokPct}% - 1.5rem)` }}
            >
              <img
                src="/rocket.png"
                alt="Rocket"
                className="rocket-img"
              />
            </div>
            <progress
              className="progress-bar"
              value={tokCollected}
              max={tokGoal}
              style={{ '--pct': `${tokPct}%` }}
            />
          </div>

          {/* $MAXX Pie & List */}
          <div className="content token">
            <div className="pie-section">
              <Pie
                data={{
                  labels: tokLabels,
                  datasets: [{ data: tokValues }]
                }}
                options={{
                  plugins: {
                    legend:  { position: 'bottom', labels: { padding: 12 } },
                    tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.parsed}%` } }
                  },
                  maintainAspectRatio: false
                }}
              />
            </div>
            <ul className="list-section">
              {tokContribs.map(c => {
                const lc   = c.address.toLowerCase();
                const name = nameMap[lc];
                return (
                  <li key={lc}>
                    <div className="addr-block">
                      {name && <span className="name">{name}</span>}
                      <span className="address-small">
                        {lc.slice(0,5)}…{lc.slice(-5)}
                      </span>
                    </div>
                    <span className="amt">
                      {c.amount.toFixed(2)} <em>({c.percentage}%)</em>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* right bear */}
      <div className="bear-side">
        <img src="/elephant.png" alt="Bear" />
      </div>
    </div>
  );
}
