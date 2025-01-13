import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface OptionsChainProps {
  symbol: string;
}

interface OptionData {
  strike: number;
  lastPrice: number;
  bid: number;
  ask: number;
  volume: number;
  openInterest: number;
}

interface CombinedOptionRow {
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

const fetchOptionsData = async (symbol: string, toast: any) => {
  try {
    // First try Polygon.io
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
      console.error("Polygon.io API failed, falling back to Finnhub");
      throw new Error("Polygon.io API failed");
    }
    
    const data = await response.json();
    console.log("Polygon.io response:", data);

    if (!data.results || data.results.length === 0) {
      console.log("No options data found in Polygon.io, trying Finnhub...");
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
  } catch (error) {
    // Try Finnhub as fallback
    try {
      console.log(`Fetching Finnhub options data for ${symbol}...`);
      const response = await fetch(
        `https://finnhub.io/api/v1/stock/option-chain?symbol=${symbol}&token=${FINNHUB_API_KEY}`
      );
      
      if (!response.ok) {
        console.error("Finnhub API failed, falling back to Alpha Vantage");
        throw new Error("Finnhub API failed");
      }
      
      const data = await response.json();
      console.log("Finnhub response:", data);

      if (!data.data || data.data.length === 0) {
        console.log("No options data found in Finnhub, trying Alpha Vantage...");
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
    } catch (error) {
      // Try Alpha Vantage as final fallback
      try {
        console.log(`Fetching Alpha Vantage options data for ${symbol}...`);
        const response = await fetch(
          `https://www.alphavantage.co/query?function=OPTIONS&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
        );
        
        if (!response.ok) {
          throw new Error("All API attempts failed");
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
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch options data from all providers",
          variant: "destructive",
        });
        throw error;
      }
    }
  }
};

const LoadingSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-8 w-48" />
    <Card className="p-4">
      <Skeleton className="h-6 w-24 mb-4" />
      <div className="space-y-2">
        {[...Array(10)].map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    </Card>
  </div>
);

const combineOptionsData = (calls: OptionData[], puts: OptionData[]): CombinedOptionRow[] => {
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

const OptionsChain = ({ symbol }: OptionsChainProps) => {
  const { toast } = useToast();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ["options", symbol],
    queryFn: () => fetchOptionsData(symbol, toast),
  });

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="text-red-500 p-4">
        Error loading options data. Please try again later.
      </div>
    );
  }

  const combinedData = combineOptionsData(data?.calls || [], data?.puts || []);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Options Chain for {symbol}</h2>
      
      <Card className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">Put Bid</TableHead>
              <TableHead className="text-right">Put Ask</TableHead>
              <TableHead className="text-right">Put Vol</TableHead>
              <TableHead className="text-center font-bold">Strike</TableHead>
              <TableHead className="text-right">Call Bid</TableHead>
              <TableHead className="text-right">Call Ask</TableHead>
              <TableHead className="text-right">Call Vol</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {combinedData.map((row, index) => (
              <TableRow key={index}>
                <TableCell className="text-right">{row.putBid.toFixed(2)}</TableCell>
                <TableCell className="text-right">{row.putAsk.toFixed(2)}</TableCell>
                <TableCell className="text-right">{row.putVolume}</TableCell>
                <TableCell className="text-center font-semibold">{row.strike.toFixed(2)}</TableCell>
                <TableCell className="text-right">{row.callBid.toFixed(2)}</TableCell>
                <TableCell className="text-right">{row.callAsk.toFixed(2)}</TableCell>
                <TableCell className="text-right">{row.callVolume}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default OptionsChain;