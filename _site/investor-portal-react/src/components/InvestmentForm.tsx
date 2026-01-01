import { useState } from 'react';
import { useSignAndExecuteTransaction, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

// Configuration
const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID || '0xYOUR_PACKAGE_ID';
const TREASURY_ID = import.meta.env.VITE_TREASURY_ID || '0xYOUR_TREASURY_ID';
const SUI_PRICE = 1.44;
const TOTAL_RAISE = 350000;
const EQUITY_OFFERED = 10;

export function InvestmentForm() {
  const account = useCurrentAccount();
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();
  const [amount, setAmount] = useState(500);
  const [status, setStatus] = useState<string>('');

  const calculateEquity = (sui: number) => {
    return ((sui / TOTAL_RAISE) * EQUITY_OFFERED).toFixed(4);
  };

  const calculateUSD = (sui: number) => {
    return (sui * SUI_PRICE).toFixed(2);
  };

  const handleInvest = () => {
    if (!account) {
      setStatus('Please connect your wallet first');
      return;
    }

    if (amount < 100) {
      setStatus('Minimum investment is 100 SUI');
      return;
    }

    setStatus('Preparing transaction...');

    // Create transaction
    const tx = new Transaction();

    // Split coins for payment (convert SUI to MIST)
    const amountInMist = amount * 1_000_000_000;
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountInMist)]);

    // Call investment contract
    tx.moveCall({
      target: `${PACKAGE_ID}::investment::invest`,
      arguments: [
        tx.object(TREASURY_ID),  // Treasury object
        coin,                     // Payment coin
        tx.object('0x6'),        // Clock object (system)
      ],
    });

    // Sign and execute
    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: (result) => {
          console.log('Investment successful:', result);
          setStatus(`✅ Investment confirmed! TX: ${result.digest.slice(0, 10)}...`);
          
          setTimeout(() => {
            setStatus('Certificate NFT sent to your wallet. Check "My Investments" tab.');
          }, 3000);
        },
        onError: (error) => {
          console.error('Investment failed:', error);
          setStatus(`❌ Investment failed: ${error.message}`);
        },
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-slate-800 p-8 rounded-2xl border-2 border-blue-600 shadow-2xl">
        <h3 className="text-2xl font-bold mb-8 text-center">Investor Commitment</h3>
        
        <div className="space-y-8">
          {/* Amount Selector */}
          <div>
            <div className="flex justify-between items-end mb-4">
              <label className="text-sm font-bold text-blue-300 uppercase tracking-widest">
                Amount to Invest
              </label>
              <span className="text-3xl font-black text-white">
                {amount} <span className="text-sm text-slate-500">SUI</span>
              </span>
            </div>
            <input
              type="range"
              min="100"
              max="10000"
              step="100"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-2">
              <span>100 SUI</span>
              <span>10,000 SUI</span>
            </div>
          </div>

          {/* Investment Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
              <div className="text-xs text-slate-500 font-bold uppercase mb-1">USD Value</div>
              <div className="text-xl font-bold text-green-400">${calculateUSD(amount)}</div>
              <div className="text-xs text-slate-500 mt-1">at ${SUI_PRICE}/SUI</div>
            </div>
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
              <div className="text-xs text-slate-500 font-bold uppercase mb-1">Your Equity</div>
              <div className="text-xl font-bold text-cyan-400">{calculateEquity(amount)}%</div>
              <div className="text-xs text-slate-500 mt-1">of ARAIL</div>
            </div>
          </div>

          {/* Vesting Info */}
          <div className="bg-blue-950/40 rounded-xl p-5 border border-blue-800 space-y-3">
            <p className="text-xs text-blue-200 font-semibold uppercase tracking-tighter">
              Investment Terms
            </p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Vesting Period</span>
              <span className="text-sm font-bold text-blue-400">12 months linear</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Monthly Unlock</span>
              <span className="text-sm font-bold text-blue-400">
                {Math.floor((amount * 1_000_000_000 * EQUITY_OFFERED) / (TOTAL_RAISE * 12)).toLocaleString()} tokens
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-blue-800 pt-2">
              <span className="text-sm text-slate-400">Treasury APY</span>
              <span className="text-sm font-bold text-blue-400">~1.91%</span>
            </div>
          </div>

          {/* Status Message */}
          {status && (
            <div className={`p-4 rounded-lg text-center text-sm font-semibold ${
              status.includes('✅') 
                ? 'bg-green-900/30 border border-green-600 text-green-400'
                : status.includes('❌')
                ? 'bg-red-900/30 border border-red-600 text-red-400'
                : 'bg-blue-900/30 border border-blue-600 text-blue-400'
            }`}>
              {status}
            </div>
          )}

          {/* Invest Button */}
          <button
            onClick={handleInvest}
            disabled={!account || isPending}
            className={`w-full py-5 rounded-xl font-black text-lg transition-all transform ${
              account && !isPending
                ? 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:scale-105 shadow-xl shadow-cyan-900/20'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isPending 
              ? '⏳ PROCESSING...' 
              : account 
              ? `INVEST ${amount} SUI` 
              : 'CONNECT WALLET FIRST'}
          </button>

          <div className="text-center text-xs text-slate-400">
            <i className="fas fa-lock mr-1"></i>
            Secure transaction via Sui blockchain • Minimum: 100 SUI
          </div>
        </div>
      </div>

      {/* What You Receive */}
      <div className="mt-8 bg-gradient-to-r from-slate-800 to-blue-900/50 p-6 rounded-xl border border-blue-600">
        <h4 className="text-lg font-semibold mb-3">📜 What You Receive</h4>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-cyan-400">✓</span>
            <span>Investment Certificate NFT (proof of ownership on Sui blockchain)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyan-400">✓</span>
            <span>Equity tokens with 12-month linear vesting</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyan-400">✓</span>
            <span>Claim vested tokens anytime via dashboard</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyan-400">✓</span>
            <span>Transparent milestone tracking (5 TAZARA project phases)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-cyan-400">✓</span>
            <span>Access to investor-only updates and governance</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
