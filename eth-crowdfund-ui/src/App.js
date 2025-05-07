// src/App.js
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { motion, useMotionValue, animate } from 'framer-motion';
import './App.css';
import useMiningStats from './useMiningStats';

const FIXED_WALLET = '0x1b69ec2F03c21CF7f9a791Be9c01EfBd01F49Ef5';

export default function App() {
  // On-chain mining stats
  const { hashrate, powerPercent, minedPerDay, currentlyMined } = useMiningStats();

  // Animate Total Power
  const powerMotion = useMotionValue(Number(powerPercent));
  const [powerDisplay, setPowerDisplay] = useState(Number(powerPercent));
  useEffect(() => {
    animate(powerMotion, Number(powerPercent), {
      duration: 0.5,
      ease: 'easeInOut',
      onUpdate(v) { setPowerDisplay(v); },
    });
  }, [powerPercent]);

  // Animate Mined per Day
  const perDayMotion = useMotionValue(Number(minedPerDay));
  const [perDayDisplay, setPerDayDisplay] = useState(Number(minedPerDay));
  useEffect(() => {
    animate(perDayMotion, Number(minedPerDay), {
      duration: 0.5,
      ease: 'easeInOut',
      onUpdate(v) { setPerDayDisplay(v); },
    });
  }, [minedPerDay]);

  // Continuous “Currently Mined” counter
  const [baseMined, setBaseMined]   = useState(() => parseFloat(currentlyMined));
  const [lastTime, setLastTime]     = useState(() => Date.now());
  const [liveMined, setLiveMined]   = useState(() => parseFloat(currentlyMined));

  useEffect(() => {
    const parsed = parseFloat(currentlyMined);
    setBaseMined(parsed);
    setLastTime(Date.now());
  }, [currentlyMined]);

  useEffect(() => {
    const ratePerSec = parseFloat(minedPerDay) / 86400;
    let frameId;
    const tick = () => {
      const elapsed = (Date.now() - lastTime) / 1000;
      setLiveMined(baseMined + ratePerSec * elapsed);
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [baseMined, lastTime, minedPerDay]);

  // Off-chain price & claimed animations
  const [maxxPrice, setMaxxPrice]     = useState(null);
  const [claimedMAXX, setClaimedMAXX] = useState(null);
  const [glowClass, setGlowClass]     = useState('');
  const animatedPrice                 = useMotionValue(0);
  const [priceDisplay, setPriceDisplay] = useState(0);
  const [changePct, setChangePct]       = useState(null);
  const [up, setUp]                      = useState(true);
  const priceRef = useRef({ prev: null, current: null });

  useEffect(() => {
    if (maxxPrice != null) {
      const ctrl = animate(animatedPrice, maxxPrice, {
        duration: 0.5,
        ease: 'easeInOut',
        onUpdate(v) { setPriceDisplay(v); },
      });
      const { prev, current } = priceRef.current;
      if (prev != null && current != null && prev !== current) {
        const diff = current - prev;
        const pct  = (diff / prev) * 100;
        setChangePct(pct.toFixed(2));
        setUp(diff > 0);
        setGlowClass(diff > 0 ? 'glow-up' : 'glow-down');
        setTimeout(() => setGlowClass(''), 500);
      }
      return () => ctrl.stop();
    }
  }, [maxxPrice]);

  // Claimed animation
  const animatedClaimed = useMotionValue(0);
  const [claimedDisp, setClaimedDisp] = useState(0);
  useEffect(() => {
    const unsub = animatedClaimed.onChange(v => setClaimedDisp(v));
    return unsub;
  }, [animatedClaimed]);
  useEffect(() => {
    if (claimedMAXX != null) {
      animate(animatedClaimed, claimedMAXX, { duration: 1, ease: 'easeInOut' });
    }
  }, [claimedMAXX]);

  // Fetch price & claimed every 5s
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await axios.get(
          'https://api.dexscreener.com/latest/dex/pairs/base/0x11bb2563a35b46d4086eec991dd5f374d8122a69e7998da1706454d4ee298148'
        );
        const p = parseFloat(res.data.pair.priceUsd);
        if (!isNaN(p)) {
          if (priceRef.current.current != null && p !== priceRef.current.current) {
            priceRef.current.prev = priceRef.current.current;
          }
          priceRef.current.current = p;
          setMaxxPrice(p);
        }
      } catch {}
    };
    const fetchClaimed = async () => {
      try {
        const res = await axios.get('http://localhost:4000/api/claimed-maxx');
        const c   = parseFloat(res.data.claimed);
        if (!isNaN(c)) setClaimedMAXX(c);
      } catch {}
    };
    fetchPrice();
    fetchClaimed();
    const id = setInterval(() => { fetchPrice(); fetchClaimed(); }, 5000);
    return () => clearInterval(id);
  }, []);

  // Leaderboard
  const contributors = [
    { name: 'Turtleneck87', address: '0x14eedac0c9cc20bc189cc144908a1221ad048401', amount: 354.89 },
    { name: 'daniel_sats',   address: '0x5efd95ced49055f9f2d945a459debfccee33aa54', amount: 709.78 },
    { name: "SAmaz'ng",      address: '0xda17f59941a8548994ba6059eadf555f3497df42', amount: 1209.78 },
    { name: 'taylor3103',    address: '0x6e13a1ebf67d41a6f8c951d748c6a27771f6804b', amount: 1419.56 },
    { name: 'Estrid',        address: '0xc2125c2689dcabbcb6afb2cfa84f46e762cb464b', amount: 300    },
    { name: 'Kinneas',       address: FIXED_WALLET,                                     amount: 2210   }
  ];

  const totalMAXX = contributors.reduce((sum, c) => sum + c.amount, 0);
  const sorted    = [...contributors].sort((a, b) => b.amount - a.amount);

  return (
    <div className="outer-wrapper">
      <div className="bear-side">
        <img src="/bear.png" alt="Bear" />
        <img src="/vines.png" className="vines" alt="Vines" />
      </div>

      <div className="app-wrapper">
        {/* Top Metrics */}
        <div className="highlight-metrics">
          <div className="metric-box">
            <h3>🎯 Contribution</h3>
            <p>{totalMAXX.toFixed(2)} $MAXX</p>
          </div>
          <div className={`metric-box ${glowClass}`}>
            <h3>💰 $MAXX Price</h3>
            <motion.p style={{ fontWeight: 'bold' }}>
              ${priceDisplay.toFixed(4)}
              {changePct !== null && (
                <span style={{ color: up ? 'green' : 'red', marginLeft: 6 }}>
                  {up ? '▲' : '▼'} {changePct}%
                </span>
              )}
            </motion.p>
          </div>
          <div className="metric-box">
            <h3>👤 Claimed</h3>
            <motion.p style={{ fontWeight: 'bold' }}>
              {claimedDisp.toFixed(2)} $MAXX
            </motion.p>
          </div>
        </div>

        {/* Current Setup */}
        <div className="current-section">
          <div className="current-setup">
            <h3>🧾 Current Setup</h3>
            <img src="/current.gif" alt="Current Setup" className="current-gif" />
          </div>
          <div className="current-stats">
            <div>Total Hash Rate: {hashrate} GH/S</div>
            <br />
            <div>Total Power: {powerDisplay.toFixed(4)}%</div>
            <br />
            <div>Mined per Day: {perDayDisplay.toFixed(0)} $MAXX</div>
            <br />
            <div>Currently Mined: {liveMined.toFixed(2)} $MAXX</div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="card">
          <ul className="list-section">
            {sorted.map((c, i) => (
              <li key={c.address}>
                <div className="addr-block">
                  <span className="rank">{i + 1}.</span>
                  <span className="name">{c.name}</span>
                  <span className="address-small" title={c.address}>
                    {c.address.slice(0, 6)}…{c.address.slice(-4)}
                  </span>
                </div>
                <span className="amt">
                  {c.amount.toFixed(2)} $MAXX (
                  {((c.amount / totalMAXX) * 100).toFixed(2)}%)
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bear-side">
        <img src="/elephant.png" alt="Elephant" />
        <img src="/vines.png" className="vines" alt="Vines" />
      </div>
    </div>
  );
}
