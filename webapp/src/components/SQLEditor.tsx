import { SQLite } from "@codemirror/lang-sql";
import { defaultHighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { createEffect, createMemo, onCleanup } from "solid-js";

export default function SQLEditor(props: {
    onSubmit?: (value: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    value: string;
    onEditingValueChanged?: (value: string) => void;
    clearSignal?: () => any;
    class?: string;
}) {
    const editorView = createMemo<EditorView, EditorView>((prevView) => {
        prevView?.destroy();

        return new EditorView({
            doc: "hello",
            extensions: [
                SQLite,
                EditorView.editorAttributes.of({
                    class: props.class ?? '',
                }),
                EditorView.theme({
                    ".cm-content": {
                        fontSize: "0.9rem"
                    }
                }),
                syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
                ...(
                    props.onSubmit ? [
                        EditorState.transactionFilter.of(tr => {
                            return tr.newDoc.lines > 1 ? [] : [tr]
                        })
                    ] : []
                ),
                EditorView.domEventHandlers({
                    keydown(event, view) {
                        if ((props.onSubmit && event.key === "Enter")) {
                            event.preventDefault();
                            if (event.target && event.target instanceof HTMLElement) {
                                event.target.blur();
                            }

                            props.onSubmit(view.state.doc.toString());
                        }
                    },

                    focus: () => props.onFocus?.(),
                    blur: () => props.onBlur?.(),
                }),
                EditorView.updateListener.of(update => {
                    if (update.docChanged && props.onEditingValueChanged) {
                        props.onEditingValueChanged(update.state.doc.toString());
                    }
                }),
            ]
        });
    });

    createEffect(() => {
        editorView().dispatch({
            changes: {
                from: 0,
                to: editorView().state.doc.length,
                insert: props.value ?? ''
            }
        });

        props.onEditingValueChanged?.(props.value);
    });

    createEffect(() => {
        if (props.clearSignal) {
            props.clearSignal();

            editorView().dispatch({
                changes: {
                    from: 0,
                    to: editorView().state.doc.length,
                    insert: ''
                }
            });
            props.onSubmit?.('');
        }
    });

    onCleanup(() => {
        editorView().destroy();
    });

    return <>{editorView().dom}</>;
}
