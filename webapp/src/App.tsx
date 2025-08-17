import {createResource, createSignal, Index, Match, Switch} from 'solid-js'
import './App.css'
import TableListPanel, {fetchTableList} from './components/TableListPanel'
import {makePersisted} from '@solid-primitives/storage';
import RecordBrowser from "./components/RecordBrowser.tsx";
import {tableRecordQueryable} from "./components/RecordQueryable.tsx";
import LazyPage from "./components/LazyPage.tsx";

function App() {
    const [selected, setSelected] = makePersisted(createSignal<string | null>(null), { name: "selected_table" });
    const [leftPanelWidth, setLeftPanelWidth] = makePersisted(createSignal(250), { name: "left_panel_width" });

    const [ tables, { refetch } ] = createResource(fetchTableList);

    return <>
        <main class="flex h-screen w-screen">
            <aside class="shrink-0 h-full">
                <nav style={{width: leftPanelWidth() + 'px'}} class="w-full h-full overflow-y-scroll" role="navigation">
                    <Switch fallback={<p>Loading...</p>}>
                        <Match when={tables.error}>
                            <p>Error loading tables: {tables.error}</p>
                        </Match>
                        <Match when={tables()}>
                            <TableListPanel
                                tables={tables()!}
                                selected={selected()}
                                setSelected={setSelected}
                                onReload={refetch}
                            />
                        </Match>
                    </Switch>
                </nav>
            </aside>

            <div
                class="w-2 cursor-col-resize"
                onMouseDown={(e) => {
                    const startX = e.clientX;
                    const startWidth = leftPanelWidth();

                    const onMouseMove = (moveEvent: MouseEvent) => {
                        const newWidth = startWidth + (moveEvent.clientX - startX);
                        setLeftPanelWidth(Math.max(100, newWidth)); // Minimum width of 100px
                        moveEvent.preventDefault();
                    };

                    e.preventDefault();

                    const onMouseUp = () => {
                        document.removeEventListener('mousemove', onMouseMove);
                        document.removeEventListener('mouseup', onMouseUp);
                    };

                    document.addEventListener('mousemove', onMouseMove);
                    document.addEventListener('mouseup', onMouseUp);
                }}
            >
                <div class="bg-primary-content/10 w-0.5 h-full" />
            </div>

            <div class="grow h-full overflow-x-hidden">
                <Switch fallback={<p>Loading...</p>}>
                    <Match when={tables.error}>
                        <p>Error loading tables: {tables.error}</p>
                    </Match>
                    <Match when={tables()}>
                        <Index each={tables()}>{ (table) =>
                            <LazyPage active={selected() == table().name}
                                      component={RecordBrowser}
                                      componentProps={{
                                          queryable: tableRecordQueryable(table().name)
                                      }} />
                        }</Index>
                    </Match>
                </Switch>
            </div>
        </main>
    </>;
}

export default App
