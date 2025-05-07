// src/useMiningStats.js
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import ABI from './ContractABI.json';

const CONTRACT_ADDRESS = '0x18c389e739676dcd15386d131e22e1cea5b84ad8';
const WALLET_ADDRESS   = '0x1b69ec2F03c21CF7f9a791Be9c01EfBd01F49Ef5';
const STORAGE_KEY      = 'miningStats';

const DEFAULT_STATS = {
  hashrate:       '0',
  powerPercent:   '0.0000',
  minedPerDay:    '0',
  currentlyMined: '0.00',
};

export default function useMiningStats() {
  const [stats, setStats] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || DEFAULT_STATS;
    } catch {
      return DEFAULT_STATS;
    }
  });

  useEffect(() => {
    const fetchStats = async () => {
      const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

      // fire all four calls, map reverts to null
      const [
        rawHashrate,
        totalHash,
        perBlock,
        pendingRewards
      ] = await Promise.all([
        contract.playerHashrate(WALLET_ADDRESS).catch(err => {
          console.warn('playerHashrate failed', err);
          return null;
        }),
        contract.totalHashrate().catch(err => {
          console.warn('totalHashrate failed', err);
          return null;
        }),
        contract.playerEthermaxPerBlock(WALLET_ADDRESS).catch(err => {
          console.warn('playerEthermaxPerBlock failed', err);
          return null;
        }),
        contract.pendingRewards(WALLET_ADDRESS).catch(err => {
          console.warn('pendingRewards failed', err);
          return null;
        }),
      ]);

      setStats(prev => {
        // only replace if non-null
        const hashrate = rawHashrate != null
          ? rawHashrate.toString()
          : prev.hashrate;

        const powerPercent = rawHashrate != null && totalHash != null
          ? ((Number(rawHashrate)*100)/Number(totalHash)).toFixed(4)
          : prev.powerPercent;

        const minedPerDay = perBlock != null
          ? ((Number(perBlock)/1e18)*28800).toFixed(0)
          : prev.minedPerDay;

        const rawPending = pendingRewards != null
          ? Number(pendingRewards)/1e18
          : parseFloat(prev.currentlyMined);

        const currentlyMined = pendingRewards != null
          ? (Math.floor(rawPending*100)/100).toFixed(2)
          : prev.currentlyMined;

        const newStats = { hashrate, powerPercent, minedPerDay, currentlyMined };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
        return newStats;
      });
    };

    // initial + every 5s
    fetchStats();
    const id = setInterval(fetchStats, 5000);
    return () => clearInterval(id);
  }, []);

  return stats;
}
