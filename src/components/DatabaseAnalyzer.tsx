
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import ErrorDisplay from "@/components/auth/test-utils/ErrorDisplay";

export const DatabaseAnalyzer = () => {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [columns, setColumns] = useState<any[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Record<string, string>>({});

  const fetchTables = async () => {
    setLoading(true);
    setError({});
    try {
      const { data, error } = await supabase
        .from('pg_catalog.pg_tables')
        .select('tablename')
        .eq('schemaname', 'public');
        
      if (error) throw error;
      
      const tableNames = data.map(t => t.tablename).filter(
        // Exclude system tables
        name => !name.startsWith('pg_') && !name.startsWith('_')
      );
      
      setTables(tableNames);
      console.log('Available tables:', tableNames);
    } catch (err: any) {
      console.error('Error fetching tables:', err);
      setError({ database: err.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchTableInfo = async (tableName: string) => {
    setLoading(true);
    setError({});
    try {
      // Get column information
      const { data: columnsData, error: columnsError } = await supabase
        .rpc('get_table_columns', { table_name: tableName });
        
      if (columnsError) throw columnsError;
      
      setColumns(columnsData || []);
      console.log(`Columns for ${tableName}:`, columnsData);
      
      // Get sample data (first 5 rows)
      const { data: sampleData, error: dataError } = await supabase
        .from(tableName)
        .select('*')
        .limit(5);
        
      if (dataError) throw dataError;
      
      setData(sampleData || []);
      console.log(`Sample data for ${tableName}:`, sampleData);
      
      setSelectedTable(tableName);
    } catch (err: any) {
      console.error(`Error fetching info for ${tableName}:`, err);
      setError({ tableInfo: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Fallback if RPC not available
  const analyzeWithoutRPC = async () => {
    setLoading(true);
    setError({});
    
    try {
      // Direct query for available tables
      const { data: tablesData, error: tablesError } = await supabase.rpc('get_all_tables');
      
      if (tablesError) {
        console.log("RPC not available, using direct SQL");
        // If RPC fails, we'll console log table requests
        console.log("Please create the following RPC function in your Supabase project:");
        console.log(`
CREATE OR REPLACE FUNCTION public.get_table_columns(table_name text)
RETURNS TABLE(column_name text, data_type text, is_nullable boolean, column_default text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    column_name::text, 
    data_type::text,
    (is_nullable = 'YES') as is_nullable,
    column_default::text
  FROM 
    information_schema.columns
  WHERE 
    table_schema = 'public' 
    AND table_name = table_name;
$$;
        `);
        
        const tablesQuery = `
          SELECT tablename FROM pg_catalog.pg_tables 
          WHERE schemaname = 'public'
        `;
        console.log("Tables query:", tablesQuery);
      } else {
        setTables(tablesData);
      }
    } catch (err: any) {
      console.error('Error in analysis:', err);
      setError({ analysis: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Database Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={fetchTables} 
              disabled={loading}
            >
              {loading ? "Analyzing..." : "Analyze Database"}
            </Button>
            
            <Button 
              onClick={analyzeWithoutRPC} 
              variant="outline"
              disabled={loading}
            >
              Fallback Analysis
            </Button>
            
            {error && Object.keys(error).length > 0 && (
              <ErrorDisplay errors={error} />
            )}
            
            {tables.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-2">Available Tables</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {tables.map(table => (
                    <Button 
                      key={table}
                      variant="outline"
                      onClick={() => fetchTableInfo(table)}
                      className={selectedTable === table ? "bg-primary/20" : ""}
                    >
                      {table}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {selectedTable && columns.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-2">Table Structure: {selectedTable}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="border px-4 py-2 text-left">Column</th>
                        <th className="border px-4 py-2 text-left">Type</th>
                        <th className="border px-4 py-2 text-left">Nullable</th>
                        <th className="border px-4 py-2 text-left">Default</th>
                      </tr>
                    </thead>
                    <tbody>
                      {columns.map((col, i) => (
                        <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                          <td className="border px-4 py-2">{col.column_name}</td>
                          <td className="border px-4 py-2">{col.data_type}</td>
                          <td className="border px-4 py-2">{col.is_nullable ? "Yes" : "No"}</td>
                          <td className="border px-4 py-2">{col.column_default || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {selectedTable && data.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-2">Sample Data: {selectedTable}</h3>
                <div className="overflow-x-auto">
                  <pre className="p-4 bg-muted rounded-md text-xs">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseAnalyzer;
