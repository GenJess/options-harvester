
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { CombinedOptionRow } from "@/services/optionsData";

interface OptionsTableProps {
  data: CombinedOptionRow[];
}

const OptionsTable = ({ data }: OptionsTableProps) => {
  return (
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
        {data.map((row, index) => (
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
  );
};

export default OptionsTable;
