import { SQLite } from "@codemirror/lang-sql";
import { defaultHighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { createEffect } from "solid-js";

export default function SQLEditor(props: {
    value?: string;
    onSubmit: (value: string) => void;
    singleLine?: boolean;
    onFocus?: () => void;
    onBlur?: () => void;
}) {
    const editorView = new EditorView({
        doc: "hello",
        extensions: [
            SQLite,
            EditorView.editorAttributes.of({
                class: "w-full text-medium"
            }),
            EditorView.theme({
                ".cm-content": {
                    fontSize: "1rem"
                }
            }),
            syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
            ...(
                props.singleLine ? [
                    EditorState.transactionFilter.of(tr => {
                        return tr.newDoc.lines > 1 ? [] : [tr]
                    })
                ] : []
            ),
            EditorView.domEventHandlers({
                keydown(event, view) {
                    if ((props.singleLine && event.key === "Enter")) {
                        event.preventDefault();
                        props.onSubmit(view.state.doc.toString());
                    }
                },

                focus: () => props.onFocus?.(),
                blur: () => props.onBlur?.(),
            }),
        ]
    });

    createEffect(() => {
        editorView.dispatch({
            changes: {
                from: 0,
                to: editorView.state.doc.length,
                insert: props.value ?? ''
            }
        });
    });


    return editorView.dom;
}
