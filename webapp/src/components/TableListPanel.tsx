import './TableListPanel.css';

import {createResource, For, Match, Show, Switch} from 'solid-js'
import {executeSQL} from "../api.ts";

async function fetchTableList() {
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
    selected: string | null,
    setSelected: (name: string) => void
}) {
    const [data, { refetch }] = createResource(fetchTableList)
    return (
        <div class="w-full h-full flex flex-col p-1">
            <h2>Tables & Views</h2>
            <div>
                <button onClick={refetch}>Reload</button>&nbsp;
                <Show when={data.loading}>Loading...</Show>
            </div>

                <Switch fallback={<p>Loading...</p>}>
                    <Match when={data.error}>
                        <p>Error: {data.error}</p>
                    </Match>

                    <Match when={!!data()}>
                        <ul class="grow overflow-y-scroll table-list">
                            <For each={data()}>{({name, type}) =>
                                <li
                                    aria-selected={props.selected == name}
                                    onClick={() => props.setSelected(name)}>
                                    {name} <span>({type})</span>
                                </li>
                            }</For>
                        </ul>
                    </Match>
                </Switch>
        </div>
    )
}
