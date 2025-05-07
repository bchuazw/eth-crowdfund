import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { motion, useMotionValue, animate } from 'framer-motion';
import './App.css';

export default function App() {
  const [maxxPrice, setMaxxPrice] = useState(null);
  const [claimedMAXX, setClaimedMAXX] = useState(null);
  const [glowClass, setGlowClass] = useState(''); // glow class for price

  const animatedClaimed = useMotionValue(0);
  const animatedPrice = useMotionValue(0);

  const [animatedPriceDisplay, setAnimatedPriceDisplay] = useState(0);
  const [changePercentDisplay, setChangePercentDisplay] = useState(null);
  const [changeDirectionUp, setChangeDirectionUp] = useState(true);

  const priceRef = useRef({ prev: null, current: null });

  useEffect(() => {
    if (claimedMAXX !== null) {
      animatedClaimed.set(claimedMAXX);
      const controls = animate(animatedClaimed, claimedMAXX, {
        duration: 1,
        ease: 'easeInOut',
      });
      return () => controls.stop();
    }
  }, [claimedMAXX]);

  useEffect(() => {
    if (maxxPrice !== null) {
      animate(animatedPrice, maxxPrice, {
        duration: 0.5,
        ease: 'easeInOut',
        onUpdate: latest => {
          setAnimatedPriceDisplay(latest);
        }
      });

      const prev = priceRef.current.prev;
      const curr = priceRef.current.current;

      if (prev !== null && curr !== null && prev !== curr) {
        const diff = curr - prev;
        const percent = (diff / prev) * 100;
        setChangePercentDisplay(Math.abs(percent));
        setChangeDirectionUp(diff >= 0);

        // Trigger glow effect
        setGlowClass(diff >= 0 ? 'glow-up' : 'glow-down');
        setTimeout(() => setGlowClass(''), 500);
      }
    }
  }, [maxxPrice]);

  const fetchMaxxPrice = async () => {
    try {
      const res = await axios.get(
        'https://api.dexscreener.com/latest/dex/pairs/base/0x11bb2563a35b46d4086eec991dd5f374d8122a69e7998da1706454d4ee298148'
      );
      const priceRaw = res.data?.pair?.priceUsd;
      const price = parseFloat(priceRaw);

      if (!isNaN(price)) {
        if (priceRef.current.current !== null && price !== priceRef.current.current) {
          priceRef.current.prev = priceRef.current.current;
        }
        priceRef.current.current = price;
        setMaxxPrice(price);
      }
    } catch (err) {
      console.error('❌ Error fetching MAXX price:', err);
    }
  };

  const fetchClaimedMAXX = async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/claimed-maxx');
      const claimed = parseFloat(res.data?.claimed);
      if (!isNaN(claimed)) {
        animatedClaimed.set(claimed);
        setClaimedMAXX(claimed);
      }
    } catch (err) {
      console.error('❌ Error fetching claimed MAXX:', err);
    }
  };

  useEffect(() => {
    fetchMaxxPrice();
    fetchClaimedMAXX();

    const interval = setInterval(() => {
      fetchMaxxPrice();
      fetchClaimedMAXX();
    }, 10000); // ✅ 10 seconds confirmed

    return () => clearInterval(interval);
  }, []);

  const contributors = [
    { name: 'Turtleneck87', address: '0x14eedac0c9cc20bc189cc144908a1221ad048401', amount: 354.89 },
    { name: 'daniel_sats', address: '0x5efd95ced49055f9f2d945a459debfccee33aa54', amount: 709.78 },
    { name: "SAmaz'ng", address: '0xda17f59941a8548994ba6059eadf555f3497df42', amount: 1209.78 },
    { name: 'taylor3103', address: '0x6e13a1ebf67d41a6f8c951d748c6a27771f6804b', amount: 1419.56 },
    { name: 'Estrid', address: '0xc2125c2689dcabbcb6afb2cfa84f46e762cb464b', amount: 300 }
  ];

  const totalMAXX = 3984.06;

  return (
    <div className="outer-wrapper">
      <div className="bear-side">
        <img src="/bear.png" alt="Bear" />
        <img src="/vines.png" className="vines" alt="Vines" />
      </div>

      <div className="app-wrapper">
        <div className="highlight-metrics">
          <div className="metric-box">
            <h3>🎯 Contribution</h3>
            <p>{totalMAXX.toFixed(2)} $MAXX</p>
          </div>
          <div className={`metric-box ${glowClass}`}>
            <h3>💰 $MAXX Price</h3>
            <motion.p style={{ fontWeight: 'bold' }}>
              ${animatedPriceDisplay.toFixed(4)}{' '}
              {changePercentDisplay !== null && (
                <motion.span
                  style={{
                    color: changeDirectionUp ? 'green' : 'red',
                    fontWeight: 'bold',
                    marginLeft: '6px',
                  }}
                >
                  {changeDirectionUp ? '▲' : '▼'} {changePercentDisplay.toFixed(2)}%
                </motion.span>
              )}
            </motion.p>
          </div>
          <div className="metric-box">
            <h3>🏛 Claimed</h3>
            <motion.p>
              {animatedClaimed.get().toFixed(2)} $MAXX
            </motion.p>
          </div>
        </div>

        <div className="current-section">
          <div className="current-setup">
            <h3>🧾 Current Setup</h3>
            <img src="/current.gif" alt="Current Setup" className="current-gif" />
          </div>
          <div className="current-stats">
            <div>Total Hash Rate: 2,829 GH/S</div>
            <br />
            <div>Total Power: 0.0512%</div>
            <br />
            <div>Mined per Day: 737 $MAXX</div>
            <br />
            <div>Currently Mined: 0 $MAXX (Placeholder value)</div>
          </div>
        </div>

        <div className="card">
          <ul className="list-section">
            {contributors.map(c => (
              <li key={c.address}>
                <div className="addr-block">
                  <span className="name">{c.name}</span>
                  <span className="address-small" title={c.address}>
                    {c.address.slice(0, 5)}...{c.address.slice(-5)}
                  </span>
                </div>
                <span className="amt">
                  {c.amount.toFixed(2)} $MAXX ({((c.amount / totalMAXX) * 100).toFixed(2)}%)
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
