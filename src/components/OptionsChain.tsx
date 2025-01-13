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

const POLYGON_API_KEY = 'iSdy32szwiugL0_Auh_1ubG89967EveO';
const FINNHUB_API_KEY = 'cu2d0ipr01ql7sc7aes0cu2d0ipr01ql7sc7aesg';
const ALPHA_VANTAGE_API_KEY = 'PUSIAKNSNY5KMB2P';

const fetchOptionsData = async (symbol: string, toast: any) => {
  try {
    // First try Polygon.io
    const response = await fetch(
      `https://api.polygon.io/v3/reference/options/contracts?underlying_ticker=${symbol}&limit=100&expiration_date.lte=2024-12-31`,
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

    const options = data.results || [];
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
      const response = await fetch(
        `https://finnhub.io/api/v1/stock/option-chain?symbol=${symbol}&token=${FINNHUB_API_KEY}`
      );
      
      if (!response.ok) {
        console.error("Finnhub API failed, falling back to Alpha Vantage");
        throw new Error("Finnhub API failed");
      }
      
      const data = await response.json();
      console.log("Finnhub response:", data);

      const calls = (data.data || [])
        .filter((opt: any) => opt.type === 'call')
        .map((opt: any) => ({
          strike: opt.strike,
          lastPrice: opt.lastPrice || 0,
          bid: opt.bid || 0,
          ask: opt.ask || 0,
          volume: opt.volume || 0,
          openInterest: opt.openInterest || 0,
        }));

      const puts = (data.data || [])
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
        const response = await fetch(
          `https://www.alphavantage.co/query?function=OPTIONS&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
        );
        
        if (!response.ok) {
          throw new Error("All API attempts failed");
        }
        
        const data = await response.json();
        console.log("Alpha Vantage response:", data);

        // Get the first expiration date's data
        const firstExpiry = Object.keys(data)[0];
        const optionsData = data[firstExpiry];

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
    <div className="grid md:grid-cols-2 gap-6">
      {[0, 1].map((i) => (
        <Card key={i} className="p-4">
          <Skeleton className="h-6 w-24 mb-4" />
          <div className="space-y-2">
            {[...Array(5)].map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        </Card>
      ))}
    </div>
  </div>
);

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

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Options Chain for {symbol}</h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Calls</h3>
          <OptionsTable options={data?.calls || []} />
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-medium mb-4">Puts</h3>
          <OptionsTable options={data?.puts || []} />
        </Card>
      </div>
    </div>
  );
};

const OptionsTable = ({ options }: { options: OptionData[] }) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Strike</TableHead>
        <TableHead>Last</TableHead>
        <TableHead>Bid</TableHead>
        <TableHead>Ask</TableHead>
        <TableHead>Volume</TableHead>
        <TableHead>OI</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {options.map((option, index) => (
        <TableRow key={index}>
          <TableCell>{option.strike}</TableCell>
          <TableCell>{option.lastPrice}</TableCell>
          <TableCell>{option.bid}</TableCell>
          <TableCell>{option.ask}</TableCell>
          <TableCell>{option.volume}</TableCell>
          <TableCell>{option.openInterest}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

export default OptionsChain;