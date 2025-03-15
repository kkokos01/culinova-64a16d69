
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import ErrorDisplay from "@/components/auth/test-utils/ErrorDisplay";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const DatabaseAnalyzer = () => {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [columns, setColumns] = useState<any[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [rowCount, setRowCount] = useState<number>(0);
  const [rlsPolicies, setRlsPolicies] = useState<any[]>([]);
  const [functions, setFunctions] = useState<any[]>([]);
  const [triggers, setTriggers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('structure');

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
        .rpc('get_table_columns', { table_name: tableName })
        .catch(async () => {
          // If RPC fails, use a direct query
          return await supabase
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable, column_default')
            .eq('table_schema', 'public')
            .eq('table_name', tableName);
        });
        
      if (columnsError) throw columnsError;
      
      setColumns(columnsData || []);
      console.log(`Columns for ${tableName}:`, columnsData);
      
      // Get row count
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
        
      if (countError) throw countError;
      
      setRowCount(count || 0);
      console.log(`Row count for ${tableName}:`, count);
      
      // Get sample data (first 5 rows)
      const { data: sampleData, error: dataError } = await supabase
        .from(tableName)
        .select('*')
        .limit(5);
        
      if (dataError) throw dataError;
      
      setData(sampleData || []);
      console.log(`Sample data for ${tableName}:`, sampleData);
      
      // Get RLS policies
      const { data: policiesData, error: policiesError } = await supabase
        .from('pg_catalog.pg_policies')
        .select('*')
        .eq('schemaname', 'public')
        .eq('tablename', tableName);
        
      if (policiesError) throw policiesError;
      
      setRlsPolicies(policiesData || []);
      console.log(`RLS policies for ${tableName}:`, policiesData);
      
      // Get triggers
      const { data: triggersData, error: triggersError } = await supabase
        .from('pg_catalog.pg_trigger')
        .select('*')
        .eq('tgrelid', `public.${tableName}::regclass`);
        
      if (triggersError) {
        console.log('Error fetching triggers:', triggersError);
        // Don't throw error, just set empty array
        setTriggers([]);
      } else {
        setTriggers(triggersData || []);
        console.log(`Triggers for ${tableName}:`, triggersData);
      }
      
      setSelectedTable(tableName);
      setActiveTab('structure');
    } catch (err: any) {
      console.error(`Error fetching info for ${tableName}:`, err);
      setError({ tableInfo: err.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchDatabaseFunctions = async () => {
    setLoading(true);
    setError({});
    try {
      const { data: functionsData, error: functionsError } = await supabase
        .from('pg_catalog.pg_proc')
        .select('proname, prosrc')
        .eq('pronamespace', 'public'::text::regnamespace);
        
      if (functionsError) throw functionsError;
      
      setFunctions(functionsData || []);
      console.log(`Database functions:`, functionsData);
    } catch (err: any) {
      console.error('Error fetching functions:', err);
      setError({ functions: err.message });
    } finally {
      setLoading(false);
    }
  };

  const renderJsonData = (data: any) => {
    try {
      return (
        <pre className="text-xs overflow-x-auto p-4 bg-muted/50 rounded-md">
          {JSON.stringify(data, null, 2)}
        </pre>
      );
    } catch (e) {
      return <p className="text-red-500">Error rendering data</p>;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Database Analysis</CardTitle>
          <CardDescription>
            Analyze your Supabase database structure and data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={fetchTables} 
                disabled={loading}
                variant="default"
              >
                {loading ? "Analyzing..." : "Analyze Tables"}
              </Button>
              
              <Button 
                onClick={fetchDatabaseFunctions} 
                disabled={loading}
                variant="outline"
              >
                {loading ? "Loading..." : "Analyze Functions"}
              </Button>
            </div>
            
            {error && Object.keys(error).length > 0 && (
              <ErrorDisplay errors={error} />
            )}
            
            {tables.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-2">Available Tables</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
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
            
            {functions.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-2">Database Functions</h3>
                <Accordion type="single" collapsible className="w-full">
                  {functions.map((func, index) => (
                    <AccordionItem key={index} value={`function-${index}`}>
                      <AccordionTrigger className="font-medium">
                        {func.proname}
                      </AccordionTrigger>
                      <AccordionContent>
                        <pre className="text-xs overflow-x-auto p-4 bg-muted/50 rounded-md whitespace-pre-wrap">
                          {func.prosrc}
                        </pre>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}
            
            {selectedTable && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Table: {selectedTable}
                    <Badge variant="outline">{rowCount} rows</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-4">
                      <TabsTrigger value="structure">Structure</TabsTrigger>
                      <TabsTrigger value="data">Sample Data</TabsTrigger>
                      <TabsTrigger value="policies">RLS Policies</TabsTrigger>
                      <TabsTrigger value="triggers">Triggers</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="structure">
                      {columns.length > 0 && (
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
                                  <td className="border px-4 py-2 font-medium">{col.column_name}</td>
                                  <td className="border px-4 py-2">{col.data_type}</td>
                                  <td className="border px-4 py-2">
                                    {typeof col.is_nullable === 'string' 
                                      ? (col.is_nullable === 'YES' ? 'Yes' : 'No')
                                      : (col.is_nullable ? 'Yes' : 'No')
                                    }
                                  </td>
                                  <td className="border px-4 py-2">{col.column_default || "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="data">
                      {data.length > 0 ? (
                        renderJsonData(data)
                      ) : (
                        <p className="text-muted-foreground">No data available in this table.</p>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="policies">
                      {rlsPolicies.length > 0 ? (
                        <div className="space-y-4">
                          {rlsPolicies.map((policy, idx) => (
                            <div key={idx} className="p-4 border rounded-md">
                              <h4 className="font-medium mb-2">{policy.polname}</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="font-medium">Command:</span> {policy.cmd}
                                </div>
                                <div>
                                  <span className="font-medium">Roles:</span> {policy.roles}
                                </div>
                              </div>
                              <div className="mt-2">
                                <span className="font-medium">Definition:</span>
                                <pre className="text-xs mt-1 p-2 bg-muted rounded-md whitespace-pre-wrap">
                                  {policy.qual}
                                </pre>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No RLS policies defined for this table.</p>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="triggers">
                      {triggers.length > 0 ? (
                        <div className="space-y-4">
                          {triggers.map((trigger, idx) => (
                            <div key={idx} className="p-4 border rounded-md">
                              <h4 className="font-medium mb-2">{trigger.tgname}</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                <div>
                                  <span className="font-medium">Timing:</span> {trigger.tgtype & 16 ? 'AFTER' : 'BEFORE'}
                                </div>
                                <div>
                                  <span className="font-medium">Events:</span> {
                                    [
                                      trigger.tgtype & 4 ? 'UPDATE' : null,
                                      trigger.tgtype & 8 ? 'DELETE' : null,
                                      trigger.tgtype & 2 ? 'INSERT' : null
                                    ].filter(Boolean).join(', ')
                                  }
                                </div>
                              </div>
                              <div className="mt-2">
                                <span className="font-medium">Function:</span> {trigger.tgfoid}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No triggers defined for this table.</p>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseAnalyzer;
