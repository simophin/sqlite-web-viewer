import { useSingleSqlQuery } from "@/lib/useSqlQuery";
import { Listbox, ListboxSection, ListboxItem, ListboxProps } from "@heroui/listbox";
import { FullSizeLoader } from "./loaders";
import { useLocalQueryHistory } from "@/lib/useLocalQueryHistory";
import { useMemo } from "react";

export type TableInfo = {
    name: string;
    primary_key_columns: string[];
}

export type NavItem = {
    type: 'table',
    name: string,
} | {
    type: 'view',
    name: string,
} | {
    type: 'query',
    name: string,
};

function navItemToKey(item: NavItem): string {
    switch (item.type) {
        case 'table':
            return `table:${item.name}`;
        case 'view':
            return `view:${item.name}`;
        case 'query':
            return `query:${item.name}`;
        default:
            throw new Error(`Unknown nav item type: ${item}`);
    }
}

function navItemFromKey(key: string): NavItem | undefined {
    const parts = key.split(':');
    if (parts.length !== 2) return undefined;

    const type = parts[0];
    const name = parts[1];

    switch (type) {
        case 'table':
            return { type: 'table', name };
        case 'view':
            return { type: 'view', name };
        case 'query':
            return { type: 'query', name };
        default:
            return undefined;
    }
}

function navItemSectionLabel(item: NavItem): string {
    switch (item.type) {
        case 'table':
            return 'Tables'
        case 'view':
            return 'Views'
        case 'query':
            return 'Queries'
        default:
            throw new Error(`Unknown nav item type: ${item}`);
    }
}


export default function NavSections(
    { selectedItem, onItemSelected }: {
        selectedItem?: NavItem, onItemSelected: (selected?: NavItem) => void,
    }
) {
    const { isPending, error, data } = useSingleSqlQuery({
        sql: `SELECT m.name, m.type
         FROM sqlite_master m
         WHERE m.type IN ('table', 'view')
         ORDER BY m.type, m.name`
    });

    if (error) {
        return <p>Error loading tables: {error.message}</p>;
    }

    const [queryHistory, setQueryHistory] = useLocalQueryHistory()

    // A sorted list of items to display in the nav section
    const sectionItems = useMemo(() => {
        const result: NavItem[][] = [];

        // Add query history items first
        Object.keys(queryHistory).forEach((name) => {
            result.push([{ type: 'query', name: name as string }]);
        });

        // Add tables and views (they should have been sorted by the SQL query)
        for (const [name, type] of data?.rows ?? []) {
            const item: NavItem = type === 'table' ? {
                type: 'table',
                name: name as string,
            } : {
                type: 'view',
                name: name as string,
            };

            let sectionIndex = result.findIndex((section) => section[0].type === type);
            if (sectionIndex === -1) {
                result.push([item]);
            } else {
                result[sectionIndex].push(item);
            }
        }

        return result;
    }, [Object.keys(queryHistory), data?.rows])

    const onSelectionChange: ListboxProps['onSelectionChange'] = (keys) => {
        if (keys instanceof Set && keys.size > 0) {
            const key = keys.values().next().value;
            if (typeof key === 'string') {
                const item = navItemFromKey(key);
                if (item) {
                    onItemSelected(item);
                }
            }
        }
    };

    return (
        <div className="relative">
            <Listbox
                aria-label="Navigation sections"
                className="relative"
                selectedKeys={selectedItem ? [navItemToKey(selectedItem)] : []}
                selectionMode="single" onSelectionChange={onSelectionChange}>
                {
                    sectionItems.map((section) => (
                        <ListboxSection key={navItemSectionLabel(section[0])} title={navItemSectionLabel(section[0])} items={section} showDivider>
                            {(item) => <ListboxItem key={navItemToKey(item)}>{item.name}</ListboxItem>}
                        </ListboxSection>
                    ))
                }
            </Listbox>

            {isPending ? <FullSizeLoader /> : <></>}
        </div>
    );
}