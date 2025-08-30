import {createEffect, createMemo, type JSX} from "solid-js";
import hljs from "highlight.js/lib/core";
import {useDarkTheme} from "./useDarkTheme.ts";

import lightSheet from "highlight.js/styles/github.min.css?raw";
import darkSheet from "highlight.js/styles/github-dark-dimmed.min.css?raw";

export default function SQLHighlightView(props: { sql: string } & JSX.HTMLAttributes<HTMLPreElement>) {
    const [darkTheme] = useDarkTheme();

    createEffect(async () => {
        const sheetText = darkTheme() ? darkSheet : lightSheet;
        const themeSheet = new CSSStyleSheet();
        await themeSheet.replace(sheetText);

        // Clear and adopt the new stylesheet
        document.adoptedStyleSheets = [themeSheet];
    });

    const highlighted = createMemo(() => {
        const ele = <pre {...props}><code class="language-sql">{props.sql}</code></pre> as HTMLElement;
        hljs.highlightElement(ele);
        return ele;
    })

    return <>{highlighted()}</>
}