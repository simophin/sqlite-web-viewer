import './NavListPanel.css';

import { For } from 'solid-js'
import { executeSQL } from "../api.ts";
import {FaSolidArrowPointer, FaSolidTable, FaSolidTerminal, FaSolidWindowMaximize} from "solid-icons/fa";
import {Dynamic} from "solid-js/web";

const tableItemTypes = {
    'table': {
        'label': 'Tables',
        'icon': FaSolidTable,
    },
    'view': {
        'label': 'Views',
        'icon': FaSolidWindowMaximize,
    },
    'trigger': {
        'label': 'Triggers',
        'icon': FaSolidArrowPointer,
    }
}

export type DbItem = {
    name: string,
    type: keyof typeof tableItemTypes,
}

export async function fetchDbItems(): Promise<DbItem[]> {
    const types = Object.keys(tableItemTypes).map((t) => `'${t}'`).join(',');
    const {
        results: [
            {
                rows
            }
        ]
    } = await executeSQL({
        queries: [
            {
                sql: `SELECT name, type FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND type IN (${types}) ORDER BY type, name`,
                params: [],
            }
        ]
    });

    return rows.map(([name, type]) => {
        return {
            name: `${name}`,
            type: type as DbItem['type'],
        }
    });
}

export type NavItem = {
    id: string,
    name: string,
    type: 'console'
} | {
    name: string,
    type: DbItem['type'],
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

    return <>
        <ul class="menu w-full h-full overflow-scroll flex-nowrap">
            <For each={itemsByTypes()}>{({ type, items }) =>
                <>
                    <li class="menu-title flex flex-row items-center gap-1">
                        <Dynamic component={getGroupIcon(type)} class="w-3 h-3" />
                        {getGroupTitle(type)}
                    </li>
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
    </>;
}

function getGroupTitle(type: NavItem['type']) {
    switch (type) {
        case 'console':
            return 'Consoles';
        default:
            return tableItemTypes[type].label;
    }
}

function getGroupIcon(type: NavItem['type']) {
    switch (type) {
        case 'console':
            return FaSolidTerminal;
        default:
            return tableItemTypes[type].icon;
    }
}

function getLabel(item: NavItem) {
    switch (item.type) {
        case 'console':
            return item.id;
        case 'table':
        case 'view':
        case 'trigger':
            return item.name;
    }
}