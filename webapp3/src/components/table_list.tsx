import { useSqlQuery } from "@/lib/useSqlQuery";
import { Listbox, ListboxSection, ListboxItem, ListboxProps } from "@heroui/listbox";
import { FullSizeLoader } from "./loaders";

export type TableInfo = {
    name: string;
    primary_key_columns: string[];
}

export default function TableList(
    { selectedTable, onTableSelected }: {
        selectedTable: string | null, onTableSelected: (info: TableInfo | null) => void,
    }
) {
    const { isPending, error, data } = useSqlQuery(
        `SELECT m.name, m.type, 
                (SELECT json_group_array(info.name) FROM pragma_table_info(m.name) AS info WHERE info.pk > 0) AS pk
         FROM sqlite_master m
         ORDER BY m.type, m.name`);

    if (error) {
        return <p>Error loading tables: {error.message}</p>;
    }

    let tables: TableInfo[] = [], views: string[] = [];

    for (const [name, type, pk] of (data?.rows ?? [])) {
        switch (type) {
            case 'table': tables.push({ name, primary_key_columns: JSON.parse(pk) }); break;
            case 'view': views.push(name); break;
            default: break;
        }
    }

    const onSelectionChange: ListboxProps['onSelectionChange'] = (keys) => {
        if (keys instanceof Set && keys.size > 0) {
            const key = keys.values().next().value;
            if (typeof key === 'string') {
                let tableInfo = tables.find(t => t.name === key);
                if (!tableInfo) {
                    const foundView = views.find(v => v === key);
                    if (foundView) {
                        tableInfo = { name: foundView, primary_key_columns: [] };
                    }
                }

                if (tableInfo) {
                    onTableSelected(tableInfo);
                }
            }
        }
    };

    const sections = [
        <ListboxSection title="Tables">
            {tables.map((table) => (
                <ListboxItem
                    key={table.name}>
                    {table.name}
                </ListboxItem>
            ))}
        </ListboxSection>
    ];

    if (views.length > 0) {
        sections.push(
            <ListboxSection title="Views">
                {views.map((view) => (
                    <ListboxItem
                        key={view}>
                        {view}
                    </ListboxItem>
                ))}
            </ListboxSection>
        );
    }

    return (
        <div className="relative">
            <Listbox className="relative" selectedKeys={selectedTable ? [selectedTable] : []}
                selectionMode="single" onSelectionChange={onSelectionChange} children={sections} />

            {isPending ? <FullSizeLoader /> : <></>}
        </div>
    );
}