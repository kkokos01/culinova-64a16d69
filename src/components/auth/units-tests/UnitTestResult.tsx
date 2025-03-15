
import { AlertCircle, CheckCircle2 } from "lucide-react";

export type TestResultStatus = "idle" | "running" | "success" | "error";

export type TestResult = {
  name: string;
  status: TestResultStatus;
  message?: string;
  data?: any;
};

type UnitTestResultProps = {
  result: TestResult;
  index: number;
};

export const UnitTestResult = ({ result, index }: UnitTestResultProps) => {
  return (
    <div className="flex justify-between items-center py-1">
      <span>{result.name}:</span>
      <span className={`flex items-center ${
        result.status === "success" ? "text-green-500" : 
        result.status === "error" ? "text-red-500" : 
        result.status === "running" ? "text-blue-500" : "text-gray-500"
      }`}>
        {result.status === "success" ? (
          <><CheckCircle2 className="w-4 h-4 mr-1" /> Pass</>
        ) : result.status === "error" ? (
          <><AlertCircle className="w-4 h-4 mr-1" /> Fail</>
        ) : result.status === "running" ? (
          <>Running...</>
        ) : (
          <>Not Run</>
        )}
      </span>
    </div>
  );
};

export default UnitTestResult;
