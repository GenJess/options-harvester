
import { useToast } from "@/hooks/use-toast";

export interface OptionData {
  strike: number;
  lastPrice: number;
  bid: number;
  ask: number;
  volume: number;
  openInterest: number;
}

export interface OptionsAPIResponse {
  calls: OptionData[];
  puts: OptionData[];
}

export interface CombinedOptionRow {
  putBid: number;
  putAsk: number;
  putVolume: number;
  strike: number;
  callBid: number;
  callAsk: number;
  callVolume: number;
}

const POLYGON_API_KEY = 'iSdy32szwiugL0_Auh_1ubG89967EveO';
const FINNHUB_API_KEY = 'cu2d0ipr01ql7sc7aes0cu2d0ipr01ql7sc7aesg';
const ALPHA_VANTAGE_API_KEY = 'PUSIAKNSNY5KMB2P';

// Attempt to fetch from Polygon.io API
const fetchPolygonOptions = async (symbol: string): Promise<OptionsAPIResponse> => {
  console.log(`Fetching Polygon.io options data for ${symbol}...`);
  const response = await fetch(
    `https://api.polygon.io/v3/reference/options/contracts?underlying_ticker=${symbol}&limit=100`,
    {
      headers: {
        'Authorization': `Bearer ${POLYGON_API_KEY}`,
      },
    }
  );
  
  if (!response.ok) {
    console.error("Polygon.io API failed");
    throw new Error("Polygon.io API failed");
  }
  
  const data = await response.json();
  console.log("Polygon.io response:", data);

  if (!data.results || data.results.length === 0) {
    console.log("No options data found in Polygon.io");
    throw new Error("No options data found in Polygon.io");
  }

  const options = data.results;
  const calls = options
    .filter((opt: any) => opt.contract_type === 'call')
    .map((opt: any) => ({
      strike: parseFloat(opt.strike_price),
      lastPrice: opt.last_trade?.price || 0,
      bid: opt.bid || 0,
      ask: opt.ask || 0,
      volume: opt.volume || 0,
      openInterest: opt.open_interest || 0,
    }));

  const puts = options
    .filter((opt: any) => opt.contract_type === 'put')
    .map((opt: any) => ({
      strike: parseFloat(opt.strike_price),
      lastPrice: opt.last_trade?.price || 0,
      bid: opt.bid || 0,
      ask: opt.ask || 0,
      volume: opt.volume || 0,
      openInterest: opt.open_interest || 0,
    }));

  return { calls, puts };
};

// Attempt to fetch from Finnhub API
const fetchFinnhubOptions = async (symbol: string): Promise<OptionsAPIResponse> => {
  console.log(`Fetching Finnhub options data for ${symbol}...`);
  const response = await fetch(
    `https://finnhub.io/api/v1/stock/option-chain?symbol=${symbol}&token=${FINNHUB_API_KEY}`
  );
  
  if (!response.ok) {
    console.error("Finnhub API failed");
    throw new Error("Finnhub API failed");
  }
  
  const data = await response.json();
  console.log("Finnhub response:", data);

  if (!data.data || data.data.length === 0) {
    console.log("No options data found in Finnhub");
    throw new Error("No options data found in Finnhub");
  }

  const calls = data.data
    .filter((opt: any) => opt.type === 'call')
    .map((opt: any) => ({
      strike: opt.strike,
      lastPrice: opt.lastPrice || 0,
      bid: opt.bid || 0,
      ask: opt.ask || 0,
      volume: opt.volume || 0,
      openInterest: opt.openInterest || 0,
    }));

  const puts = data.data
    .filter((opt: any) => opt.type === 'put')
    .map((opt: any) => ({
      strike: opt.strike,
      lastPrice: opt.lastPrice || 0,
      bid: opt.bid || 0,
      ask: opt.ask || 0,
      volume: opt.volume || 0,
      openInterest: opt.openInterest || 0,
    }));

  return { calls, puts };
};

// Attempt to fetch from Alpha Vantage API
const fetchAlphaVantageOptions = async (symbol: string): Promise<OptionsAPIResponse> => {
  console.log(`Fetching Alpha Vantage options data for ${symbol}...`);
  const response = await fetch(
    `https://www.alphavantage.co/query?function=OPTIONS&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
  );
  
  if (!response.ok) {
    throw new Error("Alpha Vantage API failed");
  }
  
  const data = await response.json();
  console.log("Alpha Vantage response:", data);

  if (!data || Object.keys(data).length === 0) {
    throw new Error("No options data found in Alpha Vantage");
  }

  // Get the first expiration date's data
  const firstExpiry = Object.keys(data)[0];
  const optionsData = data[firstExpiry];

  if (!optionsData?.calls && !optionsData?.puts) {
    throw new Error("No options data found in Alpha Vantage response");
  }

  const calls = (optionsData?.calls || []).map((opt: any) => ({
    strike: parseFloat(opt.strike),
    lastPrice: parseFloat(opt.lastPrice) || 0,
    bid: parseFloat(opt.bid) || 0,
    ask: parseFloat(opt.ask) || 0,
    volume: parseInt(opt.volume) || 0,
    openInterest: parseInt(opt.openInterest) || 0,
  }));

  const puts = (optionsData?.puts || []).map((opt: any) => ({
    strike: parseFloat(opt.strike),
    lastPrice: parseFloat(opt.lastPrice) || 0,
    bid: parseFloat(opt.bid) || 0,
    ask: parseFloat(opt.ask) || 0,
    volume: parseInt(opt.volume) || 0,
    openInterest: parseInt(opt.openInterest) || 0,
  }));

  return { calls, puts };
};

// Main function to fetch data with fallbacks
export const fetchOptionsData = async (symbol: string, toast: any): Promise<OptionsAPIResponse> => {
  try {
    // First try Polygon.io
    return await fetchPolygonOptions(symbol);
  } catch (polygonError) {
    console.error("Polygon.io failed:", polygonError);
    
    try {
      // Then try Finnhub
      return await fetchFinnhubOptions(symbol);
    } catch (finnhubError) {
      console.error("Finnhub failed:", finnhubError);
      
      try {
        // Finally try Alpha Vantage
        return await fetchAlphaVantageOptions(symbol);
      } catch (alphaVantageError) {
        console.error("Alpha Vantage failed:", alphaVantageError);
        toast({
          title: "Error",
          description: "Failed to fetch options data from all providers",
          variant: "destructive",
        });
        throw new Error("All API attempts failed");
      }
    }
  }
};

// Utility function to combine calls and puts data into rows
export const combineOptionsData = (calls: OptionData[], puts: OptionData[]): CombinedOptionRow[] => {
  // Sort all strikes
  const allStrikes = [...new Set([...calls, ...puts].map(opt => opt.strike))]
    .sort((a, b) => b - a); // Sort descending

  // Get middle index to center around ATM
  const midIndex = Math.floor(allStrikes.length / 2);
  const startIndex = Math.max(0, midIndex - 5);
  const selectedStrikes = allStrikes.slice(startIndex, startIndex + 10);

  return selectedStrikes.map(strike => {
    const call = calls.find(c => c.strike === strike) || { bid: 0, ask: 0, volume: 0 };
    const put = puts.find(p => p.strike === strike) || { bid: 0, ask: 0, volume: 0 };
    
    return {
      putBid: put.bid,
      putAsk: put.ask,
      putVolume: put.volume,
      strike,
      callBid: call.bid,
      callAsk: call.ask,
      callVolume: call.volume,
    };
  });
};
