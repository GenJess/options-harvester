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

const fetchOptionsData = async (symbol: string) => {
  try {
    // First try Polygon.io
    const response = await fetch(
      `https://api.polygon.io/v3/reference/options/contracts?underlying_ticker=${symbol}&limit=100`,
      {
        headers: {
          Authorization: `Bearer ${process.env.POLYGON_API_KEY}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error("Polygon.io API failed");
    }
    
    const data = await response.json();
    // Transform the data to our format
    return {
      calls: [], // Transform polygon data to our format
      puts: [], // Transform polygon data to our format
    };
  } catch (error) {
    console.error("Polygon.io API failed, falling back to Finnhub");
    // Implement fallback to Finnhub or Alpha Vantage here
    throw error;
  }
};

const OptionsChain = ({ symbol }: OptionsChainProps) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["options", symbol],
    queryFn: () => fetchOptionsData(symbol),
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

export default OptionsChain;