import {createMemo, type JSX} from "solid-js";
import hljs from "highlight.js/lib/core";

export default function SQLHighlightView(props: { sql: string } & JSX.HTMLAttributes<HTMLPreElement>) {
    const highlighted = createMemo(() => {
        const ele = <pre {...props}><code class="language-sql">{props.sql}</code></pre> as HTMLElement;
        hljs.highlightBlock(ele);
        return ele;
    })

    return <>{highlighted()}</>
}