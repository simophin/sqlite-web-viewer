import './NavListPanel.css';

import { For } from 'solid-js'
import { executeSQL } from "../api.ts";

export type TableItem = {
    name: string,
    type: 'table' | 'view'
}

export async function fetchTableList(): Promise<TableItem[]> {
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

export type NavItem = {
    id: string,
    name: string,
    type: 'console'
} | {
    name: string,
    type: TableItem['type'],
};

export function isSameNavItem(item1: NavItem, item2: NavItem) {
    return (item1.type === 'console' && item2.type === item1.type && item1.id === item2.id) ||
        (item1.type !== 'console' && item2.type !== 'console' && item1.name === item2.name && item1.type === item2.type);
}

export default function NavListPanel(props: {
    items: NavItem[],
    selected?: NavItem,
    setSelected: (item: NavItem) => void,
    onReload: () => void,
}) {
    const itemsByTypes = () => props.items.reduce((acc, item) => {
        const index = acc.findIndex(({ type }) => type == item.type);
        if (index >= 0) {
            acc[index].items.push(item);
        } else {
            acc.push({ type: item.type, items: [item] });
        }
        return acc;
    }, [] as { type: NavItem['type'], items: [NavItem] }[]);

    return (
        <ul class="menu bg-base-200 w-full h-full overflow-scroll flex-nowrap">
            <For each={itemsByTypes()}>{({ type, items }) =>
                <>
                    <li class="menu-title">{getGroupTitle(type)}</li>
                    <For each={items}>{(item) =>
                        <li>
                            <a href="#"
                                class={"text-wrap " + ((props.selected && isSameNavItem(props.selected, item)) ? "menu-active" : "")}
                                onClick={() => props.setSelected(item)}>{getLabel(item)}</a>
                        </li>
                    }
                    </For>
                </>
            }</For>
        </ul>
    )
}

function getGroupTitle(type: NavItem['type']) {
    switch (type) {
        case 'table':
            return 'Tables';
        case 'view':
            return 'Views';
        case 'console':
            return 'Consoles';
        default:
            return type;
    }
}

function getLabel(item: NavItem) {
    switch (item.type) {
        case 'console':
            return item.id;
        case 'table':
        case 'view':
            return item.name;
    }
}