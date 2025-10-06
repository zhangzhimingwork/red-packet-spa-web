import { createConfig, http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { metaMask } from 'wagmi/connectors';

export const config = createConfig({
  chains: [mainnet, sepolia],
  connectors: [metaMask()],
  transports: {
    [mainnet.id]: http('https://eth-sepolia.g.alchemy.com/v2/qWgz8lluIE1yqE9CMm6mPtVqlhfBbKbw'),
    [sepolia.id]: http('https://eth-sepolia.g.alchemy.com/v2/qWgz8lluIE1yqE9CMm6mPtVqlhfBbKbw')
  }
});
