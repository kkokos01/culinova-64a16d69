
import { CheckCircle2, AlertCircle } from "lucide-react";

type TestStatusProps = {
  name: string;
  status: boolean | string;
};

export const TestStatus = ({ name, status }: TestStatusProps) => {
  const passed = typeof status === "boolean" ? status : status === "success";
  
  return (
    <div className="flex justify-between items-center py-1">
      <span>{name}:</span>
      <span className={`flex items-center ${passed ? "text-green-500" : "text-red-500"}`}>
        {passed ? (
          <><CheckCircle2 className="w-4 h-4 mr-1" /> Pass</>
        ) : (
          <><AlertCircle className="w-4 h-4 mr-1" /> Fail</>
        )}
      </span>
    </div>
  );
};

export default TestStatus;
