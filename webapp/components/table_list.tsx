import { useSqlQuery } from "@/lib/useSqlQuery";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "./ui/sidebar";

function Group({ label, items, selectedItem, onItemSelected }:
    { label: string, items: string[], selectedItem?: string, onItemSelected?: (item: string) => void }) {
    return <SidebarGroup>
        <SidebarGroupLabel>{label}</SidebarGroupLabel>
        <SidebarGroupContent>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item}>
                        <SidebarMenuButton isActive={item === selectedItem} onClick={() => onItemSelected?.(item)}>
                            {item}
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroupContent>
    </SidebarGroup>
}

export default function TableList(
    { selectedTable, onTableSelected }: {
        selectedTable?: string, onTableSelected?: (table: string) => void;
    }
) {
    const { isPending, error, data } = useSqlQuery(
        `SELECT name,type FROM sqlite_master ORDER BY type, name`);

    let content;

    if (isPending) {
        content = <div>Loading...</div>
    } else if (error) {
        content = <div>Error: {error.message}</div>
    } else {
        const rows = data?.rows || [];
        let tables = [], views = [];
        for (const [name, type] of rows) {
            switch (type) {
                case 'table': tables.push(name); break;
                case 'view': views.push(name); break;
                default: break;
            }
        }

        content = <>
            <Group label="Tables" items={tables} selectedItem={selectedTable} onItemSelected={onTableSelected} />
            <Group label="Views" items={views} selectedItem={selectedTable} onItemSelected={onTableSelected} />
        </>;
    }

    return (
        <Sidebar>
            <SidebarContent>
                {content}
            </SidebarContent>
        </Sidebar>
    );
}