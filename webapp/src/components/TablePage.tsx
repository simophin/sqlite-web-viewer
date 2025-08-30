import {createSignal, For} from "solid-js";
import {type DbVersion, tableRecordQueryable} from "../RecordQueryable";
import LazyPage from "./LazyPage";
import RecordBrowser from "./RecordBrowser";
import {FaSolidCode, FaSolidKey, FaSolidTable} from "solid-icons/fa";
import {Dynamic} from "solid-js/web";
import SchemaView from "./SchemaView.tsx";
import IndexView from "./IndexView.tsx";

const tabTypes = {
    'browse': {
        'label': 'Browse',
        'icon': FaSolidTable,
    },
    'schema': {
        'label': 'Schema',
        'icon': FaSolidCode,
    },

    'indices': {
        'label': 'Indices',
        'icon': FaSolidKey,
    }
} as const;

type TabType = keyof typeof tabTypes;


export default function TablePage(props: {
    table: string,
    dbVersion: DbVersion,
    visible: boolean,
}) {
    const [selectedTab, setSelectedTab] = createSignal<TabType>('browse');

    const queryable = () => tableRecordQueryable(props.table, props.dbVersion);

    return (
        <div class={"flex flex-col w-full h-full overflow-hidden " + (props.visible ? "" : " hidden")}>
            <div role="tablist" class="tabs tabs-box m-1 tabs-sm">
                <For each={Object.entries(tabTypes)}>{([tab, {label, icon}]) =>
                    <label role="tab" class={"flex gap-2 tab " + (selectedTab() == tab ? 'tab-active' : '')}
                           onclick={() => setSelectedTab(tab as TabType)}>
                        {icon && <Dynamic component={icon}/>}
                        {label}
                    </label>
                }</For>
            </div>

            <div class="grow overflow-hidden">
                <LazyPage active={selectedTab() == 'browse'}
                          component={RecordBrowser}
                          componentProps={{queryable: queryable()}}/>

                <LazyPage active={selectedTab() == 'schema'}
                          component={SchemaView}
                          componentProps={{table: props.table}}/>

                <LazyPage active={selectedTab() == 'indices'}
                          component={IndexView}
                          componentProps={{table: props.table}} />

            </div>

        </div>
    );
}