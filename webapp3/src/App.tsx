import { useMemo } from "react";
import NavSections, { NavItem } from "./components/nav_sections";
import { RecordsTable, tableRecordsQueryInfo } from "./components/record_browse";
import useLocalStorage from "./lib/useLocalStorage";

function App() {
  const [selectedNavItem, setSelectedNavItem] = useLocalStorage<NavItem | undefined>('selectedNavItem', undefined);

  const query = useMemo(() => (selectedNavItem?.type == 'table' || selectedNavItem?.type == 'view') ? tableRecordsQueryInfo(selectedNavItem.name) : null, [selectedNavItem]);

  return (
    <main className="h-screen w-screen flex">
      <div className="overflow-auto p-4 w-[20%]">
        <NavSections selectedItem={selectedNavItem} onItemSelected={setSelectedNavItem} />
      </div>

      <div className="flex-1 p-4">
        {query && <RecordsTable info={query} />}
      </div>

    </main>
  );
}

export default App;
