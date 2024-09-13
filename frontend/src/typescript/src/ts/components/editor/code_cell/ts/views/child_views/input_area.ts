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
        this.containerElement.style.height = '100%';

        // Subscribe to socket updates
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
                padding: "15px 0"
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
            // New styles for centering line numbers
            ".cm-lineNumbers .cm-gutterElement": {
                display: "flex",
                alignItems: "center",
                height: "1.4em", // Adjust this value to match your line height
                padding: "0 2px 0 5px" // Add some right padding for the colon
            }
        });
    }

    private configureLineNumbers(): Extension {
        return lineNumbers({
            formatNumber: (lineNo: number) => lineNo.toString(), // Adds a colon after each number
            domEventHandlers: {
                click: (view, line, event) => {
                    // Custom click handler for line numbers
                    console.log(`Clicked on line number ${line} in InputArea ${this.id}`);
                    // You can add more complex logic here if needed
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
                { tag: tags.keyword, color: "#0000FF" },          // Blue for keywords
                { tag: tags.operator, color: "#000000" },         // Black for operators
                { tag: tags.variableName, color: "#000000" },     // Black for variable names
                { tag: tags.function(tags.variableName), color: "#0000FF" }, // Blue for function names
                { tag: tags.string, color: "#BA2121" },           // Dark red for strings
                { tag: tags.number, color: "#008000" },           // Green for numbers
                { tag: tags.comment, color: "#408080", fontStyle: "italic" }, // Cyan for comments
                { tag: tags.className, color: "#0000FF" },        // Blue for class names
                { tag: tags.definition(tags.variableName), color: "#00A000" }, // Green for variable definitions
                { tag: tags.atom, color: "#008000" },             // Green for booleans and null/None
                { tag: tags.propertyName, color: "#0000FF" },     // Blue for property names
                { tag: tags.typeName, color: "#0000FF" },         // Blue for type names
                { tag: tags.meta, color: "#AA22FF" },             // Purple for decorators
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
                        EditorView.updateListener.of(this.handleDocumentChange.bind(this)),
                        this.customKeymap()
                    ]
                }),
                parent: this.containerElement
            });

            this.editor.dom.style.height = "70px";

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

    private handleDocumentChange(update: ViewUpdate) {
        if (update.docChanged) {
            console.log("Document changed");
            // Add any custom logic for document changes here
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
        // CodeMirror handles clicks internally, so we don't need to do anything here
        console.log("Click handled by CodeMirror");
    }

    handleInput(e: KeyboardEvent) {
        // Most keyboard input is handled by CodeMirror internally
        // We only need to handle special cases here
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