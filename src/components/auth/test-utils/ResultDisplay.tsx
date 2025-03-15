
import { Separator } from "@/components/ui/separator";

type ResultDisplayProps = {
  title: string;
  data: any | null;
  emptyMessage?: string;
};

export const ResultDisplay = ({ 
  title, 
  data, 
  emptyMessage = "No data found" 
}: ResultDisplayProps) => {
  return (
    <div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      {data ? (
        <pre className="bg-slate-100 p-2 rounded text-xs overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : (
        <p className="text-slate-500 italic">{emptyMessage}</p>
      )}
    </div>
  );
};

export default ResultDisplay;
