import { useMemo } from "react";
import ReactJson from "react-json-view";

export function ValueDisplay({ value, mimeTypeHint }: { value: string, mimeTypeHint?: string }) {
    const richObject = useMemo(() => {
        if (!mimeTypeHint || mimeTypeHint === 'text/plain' || mimeTypeHint === 'application/json') {
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
        return <pre><code className="whitespace-pre-line">{value}</code></pre>;
    }
}
