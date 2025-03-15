
import { Separator } from "@/components/ui/separator";
import { TestResult } from "./UnitTestResult";

type UnitTestDetailsProps = {
  results: TestResult[];
};

export const UnitTestDetails = ({ results }: UnitTestDetailsProps) => {
  return (
    <>
      {results.map((result, index) => (
        result.message && (
          <div key={`result-${index}`}>
            <h3 className="text-md font-medium">{result.name}</h3>
            <p className={`text-sm ${
              result.status === "error" ? "text-red-500" : 
              result.status === "success" ? "text-green-700" : ""
            }`}>
              {result.message}
            </p>
            {result.data && (
              <pre className="bg-slate-100 p-2 rounded text-xs overflow-auto mt-1">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            )}
            <Separator className="my-3" />
          </div>
        )
      ))}
    </>
  );
};

export default UnitTestDetails;
