import { useState } from "react";
import StockSearch from "../components/StockSearch";
import OptionsChain from "../components/OptionsChain";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const [selectedSymbol, setSelectedSymbol] = useState<string>("");
  const { toast } = useToast();

  const handleSymbolSelect = (symbol: string) => {
    setSelectedSymbol(symbol);
    toast({
      title: "Stock Selected",
      description: `Loading options data for ${symbol}`,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Stock Options Viewer</h1>
        
        <Card className="p-6">
          <StockSearch onSymbolSelect={handleSymbolSelect} />
        </Card>

        {selectedSymbol && (
          <Card className="p-6">
            <OptionsChain symbol={selectedSymbol} />
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;