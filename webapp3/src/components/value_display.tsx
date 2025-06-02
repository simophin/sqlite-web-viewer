import { Value } from "@/lib/useSqlQuery";
import { useMemo } from "react";
import ReactJson from "react-json-view";

export function ValueDisplay({ value, mimeTypeHint }: { value: Value, mimeTypeHint?: string }) {
    const richObject = useMemo(() => {
        if ((!mimeTypeHint || mimeTypeHint === 'text/plain' || mimeTypeHint === 'application/json') && typeof value === 'string') {
            const trimmedValue = value.trim();
            // Quickly check if the value is valid JSON document
            if ((value.startsWith('{') && value.endsWith('}')) || (value.startsWith('[') && value.endsWith(']'))) {
                try {
                    return JSON.parse(trimmedValue);
                } catch (e) {
                    // Not valid JSON, return as is
                    return null;
                }
            }
        } else {
            return null;
        }
    }, [value, mimeTypeHint]);

    if (richObject instanceof Date) {
        return <pre>{richObject.toISOString()}</pre>;
    } else if (richObject) {
        return <div><ReactJson src={richObject} displayDataTypes={false} name={null} /></div>
    } else {
        return <ValueCell value={value} />;
    }
}

export function ValueCell({ value }: { value: Value }) {
    if (value === null) {
        return <span className="text-gray-500 italic">NULL</span>;
    } else if (typeof value === 'string' && value.trim().length === 0) {
        return <span className="text-gray-500 italic">Empty Text</span>;
    } else if (typeof value === 'number') {
        return <span className="italic">{value}</span>;
    } else {
        return <span>{value}</span>;
    }
}