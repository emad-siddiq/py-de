// File: src/ts/components/editor/code_cell/ts/views/child_views/input_area.ts

import { EditorState, Extension } from "@codemirror/state"
import { EditorView, keymap, ViewUpdate, lineNumbers } from "@codemirror/view"
import { defaultKeymap, indentWithTab } from "@codemirror/commands"
import { python } from "@codemirror/lang-python"
import { oneDark } from "@codemirror/theme-one-dark"
import { syntaxHighlighting, defaultHighlightStyle, HighlightStyle, indentUnit} from "@codemirror/language"
import { tags } from "@lezer/highlight"
import { ObjectManager } from "../../../../../../managers/object_manager";
import { DarkMode } from "../../../../../../themes/darkmode/darkmode";

export class InputArea {
    id: string;
    cc_id: number;
    private editor: EditorView | null = null;
    private socket: WebSocket | null;
    private containerElement: HTMLElement;

    constructor(id: string, cc_id: number) {
        console.log(`Initializing InputArea with id: ${id}, cc_id: ${cc_id}`);
        this.id = id;
        this.cc_id = cc_id;
        this.socket = null;

        this.containerElement = document.createElement('div');
        this.containerElement.id = this.id;
        this.containerElement.style.width = '100%';
        this.containerElement.style.minHeight = '60px';
        this.containerElement.style.height = 'auto';

        this.containerElement.style.marginTop = '10px';
        this.containerElement.style.marginBottom = '50px';


        ObjectManager.getInstance().subscribeToSocket("codeSocket", this.updateSocket.bind(this));
    }

    private createEditorTheme() {
        return EditorView.theme({
            "&": {
                height: "100%",
                fontSize: "14px"
            },
            ".cm-content": {
                fontFamily: "monospace",
                padding: "15px 0px"
            },
            ".cm-line": {
                padding: "0 5px"
            },
            ".cm-gutters": {
                backgroundColor: "#f0f0f0",
                color: "#999",
                border: "none"
            },
            ".cm-activeLineGutter": {
                backgroundColor: "#e2e2e2"
            },
            ".cm-lineNumbers .cm-gutterElement": {
                display: "flex",
                alignItems: "center",
                height: "1.4em",
                padding: "0 2px 0 5px"
            },
            "&.cm-focused": {
                outline: "2px solid #0a84ff", // Mozilla blue color
                outlineOffset: "1px"
            },
            "&:not(.cm-focused) .cm-selectionBackground": {
                backgroundColor: "#d9d9d9"
            }
        });
    }

    private configureLineNumbers(): Extension {
        return lineNumbers({
            formatNumber: (lineNo: number) => lineNo.toString(),
            domEventHandlers: {
                click: (view, line, event) => {
                    console.log(`Clicked on line number ${line} in InputArea ${this.id}`);
                    return true;
                }
            }
        });
    }

    public initializeCodeMirror() {
        console.log(`Initializing CodeMirror for InputArea ${this.id}`);
        if (this.editor) {
            console.log(`CodeMirror already initialized for InputArea ${this.id}`);
            return;
        }

        try {
            const theme = DarkMode.enabled ? oneDark : [];

            const myHighlightStyle = HighlightStyle.define([
                { tag: tags.keyword, color: "#0000FF" },
                { tag: tags.operator, color: "#000000" },
                { tag: tags.variableName, color: "#000000" },
                { tag: tags.function(tags.variableName), color: "#0000FF" },
                { tag: tags.string, color: "#BA2121" },
                { tag: tags.number, color: "#008000" },
                { tag: tags.comment, color: "#408080", fontStyle: "italic" },
                { tag: tags.className, color: "#0000FF" },
                { tag: tags.definition(tags.variableName), color: "#00A000" },
                { tag: tags.atom, color: "#008000" },
                { tag: tags.propertyName, color: "#0000FF" },
                { tag: tags.typeName, color: "#0000FF" },
                { tag: tags.meta, color: "#AA22FF" },
            ]);

            this.editor = new EditorView({
                state: EditorState.create({
                    doc: "",
                    extensions: [
                        keymap.of([...defaultKeymap, indentWithTab]),
                        python(),
                        syntaxHighlighting(defaultHighlightStyle),
                        syntaxHighlighting(myHighlightStyle),
                        lineNumbers(),
                        this.createEditorTheme(),
                        indentUnit.of("    "),
                        theme,
                        EditorView.lineWrapping,
                        EditorView.updateListener.of((update) => {
                            if (update.docChanged || update.viewportChanged) {
                                this.updateContainerHeight();
                            }
                        }),
                        this.customKeymap(),
                        EditorView.theme({
                            "&": { height: "100%" }
                        })
                    ]
                }),
                parent: this.containerElement
            });

            this.updateContainerHeight();

            console.log(`CodeMirror initialized for InputArea ${this.id}`);
        } catch (error) {
            console.error(`Failed to initialize CodeMirror: ${error}`);
        }
    }

    private customKeymap(): Extension {
        return keymap.of([
            {
                key: "Shift-Enter",
                run: () => {
                    if (this.socket) {
                        this.socket.send(this.exportCode());
                        console.log("Sending", this.exportCode());
                    } else {
                        console.error("WebSocket is not available");
                    }
                    return true;
                }
            }
        ]);
    }

    private updateContainerHeight() {
        if (this.editor) {
            const height = Math.max(this.editor.contentHeight, 70);
            console.log(`Updating container height to ${height}px`);
            this.containerElement.style.height = `${height}px`;
            this.updateParentHeight(height);
        }
    }

    private updateParentHeight(height: number) {
        const parentCodeCell = ObjectManager.getInstance().getObject(`code-cell-${this.cc_id}`);
        if (parentCodeCell && parentCodeCell.updateHeight) {
            console.log(`Updating parent CodeCell height to ${height + 20}px`);
            parentCodeCell.updateHeight(height + 20);
        } else {
            console.error(`Failed to update parent CodeCell height`);
        }
    }

    public updateSocket(newSocket: WebSocket) {
        this.socket = newSocket;
        console.log(`InputArea ${this.id} updated with new WebSocket`);
    }

    getDiv(): HTMLElement {
        return this.containerElement;
    }

    addString(str: string, numOfTimes: number) {
        if (!this.editor) {
            console.error(`Cannot add string: Editor not initialized for InputArea ${this.id}`);
            return;
        }
        const insertion = str.repeat(numOfTimes);
        const currentPos = this.editor.state.selection.main.head;
        this.editor.dispatch({
            changes: {from: currentPos, insert: insertion},
            selection: {anchor: currentPos + insertion.length}
        });
    }

    exportCode(): string {
        if (!this.editor) {
            console.error(`Cannot export code: Editor not initialized for InputArea ${this.id}`);
            return "";
        }
        return this.editor.state.doc.toString();
    }

    removeLine(caretY: number) {
        if (!this.editor) {
            console.error(`Cannot remove line: Editor not initialized for InputArea ${this.id}`);
            return;
        }
        const doc = this.editor.state.doc;
        const line = doc.line(caretY + 1);
        this.editor.dispatch({
            changes: {from: line.from, to: line.to + 1}
        });
    }

    removeCharFromLine() {
        if (!this.editor) {
            console.error(`Cannot remove char: Editor not initialized for InputArea ${this.id}`);
            return;
        }
        const currentPos = this.editor.state.selection.main.head;
        if (currentPos > 0) {
            this.editor.dispatch({
                changes: {from: currentPos - 1, to: currentPos}
            });
        }
    }

    handleClick(e: MouseEvent) {
        if (!this.editor) {
            console.error(`Cannot handle click: Editor not initialized for InputArea ${this.id}`);
            return;
        }
        console.log("Click handled by CodeMirror");
    }

    handleInput(e: KeyboardEvent) {
        if (e.shiftKey && e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            if (this.socket) {
                this.socket.send(this.exportCode());
                console.log("Sending", this.exportCode());
            } else {
                console.error("WebSocket is not available");
            }
        }
    }
}