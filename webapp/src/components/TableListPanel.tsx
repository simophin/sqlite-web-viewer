import './TableListPanel.css';

import {For} from 'solid-js'
import {executeSQL} from "../api.ts";

export async function fetchTableList(): Promise<{ name: string, type: 'table' | 'view' }[]> {
    const {
        results: [
            {
                rows
            }
        ]
    } = await executeSQL({
        queries: [
            {
                sql: "SELECT name, type FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND type IN ('table', 'view') ORDER BY type, name",
                params: [],
            }
        ]
    });

    return rows.map(([name, type]) => {
        return {
            name: `${name}`,
            type: type == 'table' ? 'table' : 'view',
        }
    });
}

export default function TableListPanel(props: {
    tables: Array<{ name: string, type: 'table' | 'view' }>,
    selected: string | null,
    setSelected: (name: string) => void,
    onReload: () => void,
}) {
    const itemsByTypes = () => props.tables.reduce((acc, item) => {
        const index = acc.findIndex(({type}) => type == item.type);
        if (index >= 0) {
            acc[index].items.push(item.name);
        } else {
            acc.push({type: item.type, items: [item.name]});
        }
        return acc;
    }, [] as Array<{ type: string, items: [string] }>);

    return (
        <ul class="menu bg-base-200 w-full h-full overflow-scroll flex-nowrap">
            <For each={itemsByTypes()}>{({type, items}) =>
                <>
                    <li class="menu-title">{getTitle(type)}</li>
                    <For each={items}>{(name) =>
                        <li>
                            <a href="#"
                               class={"text-wrap " + (name == props.selected ? "menu-active" : "")}
                               onClick={() => props.setSelected(name)}>{name}</a>
                        </li>
                    }
                    </For>
                </>
            }</For>
        </ul>
    )
}

function getTitle(type: string) {
    switch (type) {
        case 'table':
            return 'Tables';
        case 'view':
            return 'Views';
        default:
           return type;
    }
}