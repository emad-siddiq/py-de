import { InputArea } from "./child_views/input_area";
import { CodeCellNumber } from "./child_views/cell_number";
import { Editor } from "../../../../../windows/editor/editor";
import { DarkMode } from "./../../../../../themes/darkmode/darkmode";
import { ObjectManager } from "../../../../../managers/object_manager";

class CodeCell {
    private socket: WebSocket | null;
    id: string;
    cc_id: number;
    name: string;
    input_area_id: string;
    div: HTMLElement;
    input_area: InputArea;
    editor: Editor;

    constructor(id: number, editor: Editor) {
        this.editor = editor;
        this.socket = null;

        this.name = "code-cell";
        this.id = "code-cell-" + id.toString();
        this.cc_id = id;
        this.input_area_id = this.id + "-input-area";

        this.div = this.createCodeCellDiv();
        this.applyInitialStyles();
        this.addEventListeners(this.div);

        // Subscribe to socket updates
        ObjectManager.getInstance().subscribeToSocket("codeSocket", this.updateSocket.bind(this));
    }

    private updateSocket(newSocket: WebSocket) {
        this.socket = newSocket;
        console.log(`CodeCell ${this.id} updated with new WebSocket`);
    }

    getDiv() {
        return this.div;
    }

    addEventListeners(div: HTMLElement) {
        div.addEventListener("click", this.clickHandler.bind(this));
    }

    createCodeCellDiv() {
        let code_cell = document.createElement("div");
        code_cell.setAttribute("id", this.id);
        code_cell.setAttribute("class", this.id);
        code_cell.setAttribute("cc_id", this.cc_id.toString());

        code_cell.style.left = "0%";
        code_cell.style.top = "0%";
        code_cell.style.width = "100%";
        code_cell.style.height = "70px";
        code_cell.style.boxSizing = "border-box";
        code_cell.style.position = "relative";

        let code_cell_number = new CodeCellNumber(this.cc_id);
        this.input_area = new InputArea(this.input_area_id, this.cc_id);

        code_cell.appendChild(code_cell_number.getDiv());
        code_cell.appendChild(this.input_area.getDiv());

        return code_cell;
    }

    applyInitialStyles() {
        if (DarkMode.enabled) {
            this.div.style.backgroundColor = "rgb(10, 15, 22)";
            this.div.style.color = "#FCF5F5";
            this.div.style.boxShadow = "0px 5px 15px 5px rgba(20, 255, 60, 0.2)";
        } else {
            this.div.style.backgroundColor = "white";
            this.div.style.color = "black";
            this.div.style.boxShadow = "0px 2px 15px 0px rgba(0, 0, 0, 0.1)";
        }
    }

    clickHandler() {
        this.div.style.boxShadow = "0px 5px 15px 5px rgba(20, 255, 60, .2)";
    }
}

export { CodeCell };