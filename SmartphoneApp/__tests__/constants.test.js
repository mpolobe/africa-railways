import { AFRC_CONTRACT_ADDRESS, LOCAL_RPC_URL } from '../constants/Blockchain';

describe('Blockchain Constants', () => {
  it('should have a valid contract address', () => {
    expect(AFRC_CONTRACT_ADDRESS).toBeDefined();
    expect(AFRC_CONTRACT_ADDRESS).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it('should have a valid RPC URL', () => {
    expect(LOCAL_RPC_URL).toBeDefined();
    expect(LOCAL_RPC_URL).toContain('http');
  });
});
