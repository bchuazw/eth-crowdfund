import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import './App.css';

export default function App() {
  const [data, setData] = useState(null);
  // helper to show first 5 + "…" + last 5 chars
  const truncate = (addr) => `${addr.slice(0,5)}…${addr.slice(-5)}`;

  // ← Exact checksummed addresses as printed in your console:
  const nameMap = {
    "0x14eedac0c9cc20bc189cc144908a1221ad048401": "Turtleneck87",
    "0x5efd95ced49055f9f2d945a459debfccee33aa54": "daniel_sats",
  };

  useEffect(() => {
    axios.get('/api/contributions')
      .then(res => setData(res.data))
      .catch(console.error);
  }, []);

  if (!data) {
    return (
      <div className="loading">
        <div className="spinner" />
        <p>Loading…</p>
      </div>
    );
  }

  const { totalReceived, target, contributions } = data;
  const labels = contributions.map(c => c.address.slice(0, 6) + '...');
  const values = contributions.map(c => c.percentage);
  const pct    = Math.min((totalReceived / target) * 100, 100);

  return (
    <div className="outer-wrapper">
      {/* Left Bear */}
      <div className="bear-side">
        <img src="/bear.png" alt="Bear left" />
      </div>

      {/* Centered card */}
      <div className="app-wrapper">
        <div className="card">

          {/* HEADER */}
          <div className="header">
            <h2>🎯 Goal: <span>{target} ETH</span></h2>
            <h3>🚀 Collected: <span>{totalReceived.toFixed(4)} ETH</span></h3>
          </div>

          {/* PROGRESS BAR + ROCKET */}
          <div className="progress-container">
            <div
              className="rocket-container"
              style={{ left: `calc(${pct}% - 1.5rem)` }}
            >
              <img src="/rocket.png" alt="Rocket" className="rocket-img" />
            </div>
            <progress
              className="progress-bar"
              value={totalReceived}
              max={target}
              style={{ '--pct': `${pct}%` }}
            />
          </div>

          {/* PIE CHART & CONTRIBUTOR LIST */}
          <div className="content">
            <div className="pie-section">
              <Pie
                data={{ labels, datasets: [{ data: values }] }}
                options={{
                  plugins: {
                    legend:  { position: 'bottom', labels:{ padding: 12 } },
                    tooltip: { callbacks:{ label: ctx => `${ctx.label}: ${ctx.parsed}%` } }
                  },
                  maintainAspectRatio: false
                }}
              />
            </div>

            <ul className="list-section">
              {contributions.map(c => {
                const key  = c.address;
                const name = nameMap[key];  // undefined if not mapped
                return (
                  <li key={key}>
                    <div className="addr-block">
                      {name && <span className="name">{name}</span>}
                      <span className="address-small">{truncate(key)}</span>
                    </div>
                    <span className="amt">
                      {c.amount.toFixed(4)} ETH <em>({c.percentage}%)</em>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>

      {/* Right Bear */}
      <div className="bear-side">
        <img src="/elephant.png" alt="Bear right" />
      </div>
    </div>
  );
}
