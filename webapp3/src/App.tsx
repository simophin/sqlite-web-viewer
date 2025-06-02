import { useMemo, useState } from "react";
import TableList, { TableInfo } from "./components/table_list";
import { RecordsTable, SelectedCell, tableRecordsQueryInfo } from "./components/record_browse";
import useLocalStorage from "./lib/useLocalStorage";
import { Card } from "@heroui/card";
import { ValueDisplay } from "./components/value_display";

function App() {
  const [selectedTable, setSelectedTable] = useLocalStorage<TableInfo | null>('selectedTable', null);
  const [selectedCell, setSelectedCell] = useState<SelectedCell | undefined>();

  const query = useMemo(() => selectedTable ? tableRecordsQueryInfo(selectedTable) : null, [selectedTable]);

  return (
    <main className="h-screen w-screen flex">
      <div className="overflow-auto p-4 w-[20%]">
        <TableList selectedTable={selectedTable?.name ?? null} onTableSelected={setSelectedTable} />
      </div>

      <div className="flex-1 overflow-y-auto p-4" style={{ overflowX: 'hidden' }}>
        {query && <RecordsTable info={query} selectedCell={selectedCell} onSelectedCellChange={setSelectedCell} />}
      </div>

      {selectedCell && (
        <div className="p-4 w-[25%] h-full overflow-auto">
          <Card className="p-4" shadow="sm"><ValueDisplay value={selectedCell.value} mimeTypeHint={selectedCell.columnMimeType} /> </Card>
        </div>
      )}
    </main>
  );
}

export default App;
