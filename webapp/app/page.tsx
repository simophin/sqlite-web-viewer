'use client';

import TableList from "@/components/table_list";
import TableView from "@/components/table_view";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo, useState } from "react";


const client = new QueryClient();


export default function Home() {
  const [selectedTable, setSelectedTable] = useState<string | undefined>(undefined);

  const querySql = useMemo(() => `SELECT * FROM ${selectedTable} LIMIT 100`, [selectedTable]);

  return (
    <QueryClientProvider client={client}>
      <SidebarProvider>
        <TableList selectedTable={selectedTable} onTableSelected={setSelectedTable} />
        <main>
          {selectedTable && <TableView sql={querySql} caption={`Table: ${selectedTable}`} />}
        </main>
      </SidebarProvider>
    </QueryClientProvider>
  );
}
