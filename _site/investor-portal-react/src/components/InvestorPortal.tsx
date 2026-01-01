import { useState } from 'react';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import { InvestmentForm } from './InvestmentForm';
import { BalanceChecker } from './BalanceChecker';
import { FundraisingProgress } from './FundraisingProgress';

export function InvestorPortal() {
  const account = useCurrentAccount();
  const [activeTab, setActiveTab] = useState<'invest' | 'balance'>('invest');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-blue-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🚂</span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">ARAIL</h1>
              <p className="text-xs text-blue-300 uppercase tracking-widest font-semibold">
                Africa's Digital Railway
              </p>
            </div>
          </div>
          
          <ConnectButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 bg-blue-600/30 rounded-full text-sm mb-6 animate-pulse">
            🔥 Pre-Seed Round Now Open • Limited to 50 Investors
          </div>
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
            Own the Rail OS of the Future
          </h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Be part of the infrastructure transformation connecting 2 billion Africans. 
            Working MVP. Real traction. SUI-powered treasury with auto-staking.
          </p>
        </div>

        {/* Fundraising Progress */}
        <FundraisingProgress />

        {/* Tabs */}
        {account && (
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => setActiveTab('invest')}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                activeTab === 'invest'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              💎 Invest
            </button>
            <button
              onClick={() => setActiveTab('balance')}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                activeTab === 'balance'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              📊 My Investments
            </button>
          </div>
        )}

        {/* Content */}
        {!account ? (
          <div className="max-w-2xl mx-auto bg-slate-800 p-12 rounded-2xl border border-blue-700 text-center">
            <div className="text-6xl mb-6">🔐</div>
            <h3 className="text-2xl font-bold mb-4">Connect Your Wallet</h3>
            <p className="text-slate-400 mb-8">
              Connect your Sui wallet to invest in ARAIL's Pre-Seed round and receive your equity certificate NFT.
            </p>
            <div className="flex justify-center">
              <ConnectButton />
            </div>
            <div className="mt-8 text-sm text-slate-500">
              <p>Supported wallets: Sui Wallet, Suiet, Ethos, Slush, and more</p>
            </div>
          </div>
        ) : (
          <div>
            {activeTab === 'invest' && <InvestmentForm />}
            {activeTab === 'balance' && <BalanceChecker />}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="bg-slate-800/50 p-6 rounded-xl border border-blue-700">
            <div className="text-3xl mb-4">⛓️</div>
            <h3 className="text-xl font-bold mb-2">Blockchain Verified</h3>
            <p className="text-slate-400 text-sm">
              Every investment is recorded on Sui blockchain. Your equity certificate is an NFT you truly own.
            </p>
          </div>
          <div className="bg-slate-800/50 p-6 rounded-xl border border-blue-700">
            <div className="text-3xl mb-4">📈</div>
            <h3 className="text-xl font-bold mb-2">12-Month Vesting</h3>
            <p className="text-slate-400 text-sm">
              Linear vesting protects long-term value. Claim your tokens anytime as they unlock.
            </p>
          </div>
          <div className="bg-slate-800/50 p-6 rounded-xl border border-blue-700">
            <div className="text-3xl mb-4">💰</div>
            <h3 className="text-xl font-bold mb-2">Auto-Staking Yield</h3>
            <p className="text-slate-400 text-sm">
              Treasury auto-stakes at 1.91% APY, funding operations while your principal remains secure.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-800 bg-black/40 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex justify-center gap-2 text-yellow-500 mb-4 font-bold text-sm">
            ⚠️ High-Risk Venture Opportunity
          </div>
          <p className="text-xs text-slate-500 leading-relaxed max-w-3xl mx-auto">
            Investment in ARAIL involves significant risk. Equity is distributed as NFTs on the Sui Mainnet 
            and is subject to a 12-month vesting period. This is a pre-revenue venture. Past performance 
            of Sui Network is not indicative of future returns.
          </p>
        </div>
      </footer>
    </div>
  );
}
