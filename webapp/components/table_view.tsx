import { useSqlQuery } from "@/lib/useSqlQuery";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

export default function TableView({ sql, caption }: { sql: string, caption?: string }) {
    const { isPending, error, data } = useSqlQuery(sql);

    if (isPending || error) {
        return <Table>
            {isPending && <TableBody>Loading...</TableBody>}
            {error && <TableBody>Error: {error.message}</TableBody>}
        </Table>
    }

    const { columns, rows } = data!;

    return (
        <Table>
            <TableCaption>{caption ?? sql}</TableCaption>
            <TableHeader>
                {columns.map((col) => (<TableHead>{col}</TableHead>))}
            </TableHeader>
            <TableBody>
                {rows.map((row) => (
                    <TableRow>
                        {row.map((cell) => (
                            <TableCell>{cell}</TableCell>
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}