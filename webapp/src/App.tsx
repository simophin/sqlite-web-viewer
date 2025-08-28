import { createMemo, createResource, createSignal, For, Index, Match, Show, Switch } from 'solid-js'
import './App.css'
import NavListPanel, { fetchTableList, isSameNavItem, type NavItem, type TableItem } from './components/NavListPanel.tsx'
import { makePersisted } from '@solid-primitives/storage';
import RecordBrowser from "./components/RecordBrowser.tsx";
import { tableRecordQueryable } from "./components/RecordQueryable.tsx";
import LazyPage from "./components/LazyPage.tsx";
import QueryPage from './components/QueryPage.tsx';

function App() {
    const [selected, setSelected] = makePersisted(createSignal<NavItem>(), { name: "selected_item" });
    const [leftPanelWidth, setLeftPanelWidth] = makePersisted(createSignal(250), { name: "left_panel_width" });

    const [data, { refetch }] = createResource(fetchTableList);

    const latestNavItems = createMemo<NavItem[] | undefined, NavItem[] | undefined>(prev => {
        if (data.state === 'ready') {
            return [
                { id: 'default', name: 'Default', type: 'console' },
                ...data()
            ];
        } else {
            return prev;
        }
    });

    const errorElements = () => {
        if (data.state === 'errored') {
            return <div role="alert" class="alert alert-error alert-vertical sm:alert-horizontal">
                <span>{data.error}</span>
                <button class="btn btn-sm btn-primary" onClick={refetch}>Reload</button>
            </div>
        }
    };

    const loadingElements = () => {
        return <Show when={!latestNavItems() && data.loading}>
            <div class="w-full h-full flex items-center justify-center">
                <span class="loading loading-spinner loading-lg"></span>
            </div>
        </Show>
    };

    return <>
        <main class="flex h-screen w-screen">
            <aside class="shrink-0 h-full">
                <nav style={{ width: leftPanelWidth() + 'px' }} class="w-full h-full overflow-y-scroll" role="navigation">
                    {errorElements()}

                    <Show when={!!latestNavItems()}>
                        <NavListPanel
                            items={latestNavItems()!}
                            selected={selected()}
                            setSelected={setSelected}
                            onReload={refetch}
                        />
                    </Show>

                    {loadingElements()}
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
                {errorElements()}

                <Show when={!!latestNavItems()}>
                    <For each={latestNavItems()}>{(navItem) => {
                        return <Switch>
                            <Match when={navItem.type === 'console'}>
                                <LazyPage
                                    active={!!selected() && isSameNavItem(navItem, selected()!)}
                                    component={QueryPage}
                                    componentProps={{
                                        pageId: (navItem.type === 'console') ? navItem.id : '',
                                    }} />
                            </Match>
                            <Match when={navItem.type !== 'console'}>
                                <LazyPage
                                    active={!!selected() && isSameNavItem(navItem, selected()!)}
                                    component={RecordBrowser}
                                    componentProps={{
                                        queryable: tableRecordQueryable(navItem.name)
                                    }} />
                            </Match>
                        </Switch>
                    }
                    }</For>
                </Show>

                {loadingElements()}

            </div>
        </main>
    </>;
}

export default App
