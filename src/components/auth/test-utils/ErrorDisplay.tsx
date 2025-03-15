
import { ErrorMessages } from "@/hooks/food-catalog/types";

type ErrorDisplayProps = {
  errors: ErrorMessages | Record<string, string>;
};

export const ErrorDisplay = ({ errors }: ErrorDisplayProps) => {
  if (!errors || Object.keys(errors).length === 0) return null;
  
  return (
    <div className="my-4 p-3 bg-red-50 border border-red-200 rounded-md">
      <h4 className="text-sm font-medium text-red-800">Troubleshooting Information:</h4>
      <ul className="text-xs text-red-700 mt-1 list-disc pl-5">
        {Object.entries(errors).map(([key, message]) => (
          <li key={key}>{key}: {message}</li>
        ))}
      </ul>
    </div>
  );
};

export default ErrorDisplay;
