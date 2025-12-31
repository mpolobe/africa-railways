import { 
  createNetworkConfig, 
  SuiClientProvider, 
  WalletProvider 
} from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { InvestorPortal } from './components/InvestorPortal';
import '@mysten/dapp-kit/dist/index.css';
import './App.css';

// Configure Sui networks
const { networkConfig } = createNetworkConfig({
  mainnet: { url: getFullnodeUrl('mainnet') },
  testnet: { url: getFullnodeUrl('testnet') },
});

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider 
        networks={networkConfig} 
        defaultNetwork="mainnet"
      >
        <WalletProvider
          autoConnect={true}
          slushWallet={{
            name: 'ARAIL Investor Portal'
          }}
        >
          <InvestorPortal />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}

export default App;
