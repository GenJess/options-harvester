
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { fetchOptionsData, combineOptionsData } from "@/services/optionsData";
import LoadingSkeleton from "./OptionsChain/LoadingSkeleton";
import OptionsTable from "./OptionsChain/OptionsTable";

interface OptionsChainProps {
  symbol: string;
}

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
        <OptionsTable data={combinedData} />
      </Card>
    </div>
  );
};

export default OptionsChain;
