import {
  convertUSDToLocal,
  convertLocalToUSD,
  convertUSDToAFC,
  convertAFCToUSD,
  convertAFCToLocal,
  convertLocalToAFC,
  formatCurrency,
  getAllPrices,
  getTicketPrice,
  EXCHANGE_RATES,
} from '../utils/currencyConverter';

describe('Currency Converter', () => {
  describe('USD to Local Currency', () => {
    it('should convert USD to ZMW correctly', () => {
      const result = convertUSDToLocal(10, 'ZMW');
      expect(result).toBe(275); // 10 * 27.5
    });

    it('should convert USD to TZS correctly', () => {
      const result = convertUSDToLocal(10, 'TZS');
      expect(result).toBe(25800); // 10 * 2580
    });

    it('should convert USD to KES correctly', () => {
      const result = convertUSDToLocal(10, 'KES');
      expect(result).toBe(1290); // 10 * 129
    });
  });

  describe('Local Currency to USD', () => {
    it('should convert ZMW to USD correctly', () => {
      const result = convertLocalToUSD(275, 'ZMW');
      expect(result).toBeCloseTo(10, 2);
    });

    it('should convert TZS to USD correctly', () => {
      const result = convertLocalToUSD(2580, 'TZS');
      expect(result).toBeCloseTo(1, 2);
    });
  });

  describe('AFC Conversions', () => {
    it('should convert USD to AFC (1:1 peg)', () => {
      const result = convertUSDToAFC(10);
      expect(result).toBe(10);
    });

    it('should convert AFC to USD (1:1 peg)', () => {
      const result = convertAFCToUSD(10);
      expect(result).toBe(10);
    });

    it('should convert AFC to ZMW correctly', () => {
      const result = convertAFCToLocal(10, 'ZMW');
      expect(result).toBe(275); // 10 AFC = 10 USD = 275 ZMW
    });

    it('should convert ZMW to AFC correctly', () => {
      const result = convertLocalToAFC(275, 'ZMW');
      expect(result).toBeCloseTo(10, 2);
    });
  });

  describe('Currency Formatting', () => {
    it('should format USD with symbol', () => {
      const result = formatCurrency(10.50, 'USD');
      expect(result).toBe('$10.50');
    });

    it('should format ZMW with symbol', () => {
      const result = formatCurrency(275, 'ZMW');
      expect(result).toBe('ZK275.00');
    });

    it('should format TZS without decimals', () => {
      const result = formatCurrency(2580, 'TZS');
      expect(result).toBe('TSh2,580');
    });

    it('should format with currency code when requested', () => {
      const result = formatCurrency(10, 'USD', { showCode: true });
      expect(result).toBe('$10.00 USD');
    });
  });

  describe('Get All Prices', () => {
    it('should return all price formats', () => {
      const result = getAllPrices(10, 'ZMW');
      
      expect(result).toHaveProperty('usd', 10);
      expect(result).toHaveProperty('local', 275);
      expect(result).toHaveProperty('afc', 10);
      expect(result).toHaveProperty('localCurrency', 'ZMW');
    });
  });

  describe('Ticket Prices', () => {
    it('should get economy ticket price for TAZARA route', () => {
      const price = getTicketPrice('Kapiri Mposhi → Dar es Salaam', 'economy');
      expect(price).toBe(25);
    });

    it('should get business ticket price for TAZARA route', () => {
      const price = getTicketPrice('Kapiri Mposhi → Dar es Salaam', 'business');
      expect(price).toBe(45);
    });

    it('should get first class ticket price for TAZARA route', () => {
      const price = getTicketPrice('Kapiri Mposhi → Dar es Salaam', 'first');
      expect(price).toBe(75);
    });

    it('should return null for unknown route', () => {
      const price = getTicketPrice('Unknown Route', 'economy');
      expect(price).toBeNull();
    });

    it('should default to economy if class not found', () => {
      const price = getTicketPrice('Kapiri Mposhi → Dar es Salaam', 'invalid');
      expect(price).toBe(25); // Falls back to economy
    });
  });

  describe('Exchange Rates', () => {
    it('should have valid exchange rates', () => {
      expect(EXCHANGE_RATES.ZMW).toBeGreaterThan(0);
      expect(EXCHANGE_RATES.TZS).toBeGreaterThan(0);
      expect(EXCHANGE_RATES.KES).toBeGreaterThan(0);
      expect(EXCHANGE_RATES.USD).toBe(1);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should calculate correct price for economy TAZARA ticket in all currencies', () => {
      const priceUSD = 25;
      const prices = getAllPrices(priceUSD, 'ZMW');
      
      expect(prices.usd).toBe(25);
      expect(prices.afc).toBe(25);
      expect(prices.local).toBe(687.5); // 25 * 27.5
    });

    it('should calculate correct price for business ZRL ticket in TZS', () => {
      const priceUSD = 20;
      const prices = getAllPrices(priceUSD, 'TZS');
      
      expect(prices.usd).toBe(20);
      expect(prices.afc).toBe(20);
      expect(prices.local).toBe(51600); // 20 * 2580
    });

    it('should handle fractional AFC amounts', () => {
      const priceUSD = 12.50;
      const afc = convertUSDToAFC(priceUSD);
      
      expect(afc).toBe(12.50);
    });
  });
});
