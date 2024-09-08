import { InputArea } from "./child_views/input_area";
import { CodeCellNumber } from "./child_views/cell_number";
import { DarkMode } from "./../../../../../themes/darkmode/darkmode";
import { ObjectManager } from "../../../../../managers/object_manager";
import { DOM } from "./../../../../../utility/dom";
import { OutputCell } from "./../../../output_cell/output_cell";

class CodeCell {
    private socket: WebSocket | null;
    id: string;
    cc_id: number;
    name: string;
    input_area_id: string;
    div: HTMLElement;
    input_area: InputArea;
    

    constructor(id: number) {
        this.socket = null;

        this.name = "code-cell";
        this.id = "code-cell-" + id.toString();
        this.cc_id = id;
        this.input_area_id = this.id + "-input-area";
        this.input_area = new InputArea(this.input_area_id, this.cc_id);

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

        code_cell.appendChild(code_cell_number.getDiv());
        code_cell.appendChild(this.input_area.getDiv());

        return code_cell;
    }

    /*

        This should add a code cell after the currently active cell. 
        A currently active cell is one that has been clicked on.
        Clicking on another code cell should switch active code cell.
        Click anywhere besides a code cell should switch active code cell to none.

    */
    static addCodeCell(cc_id: number, after_cell_id: string) {

        // Create a new Code Cell
        console.log(`Adding new code cell with cc_id: ${cc_id}`);
        let code_cell = new CodeCell(cc_id);

        // If there is no currently active cell or the currently active cell is the last one in the editor
        // Then we just append the child to the end of the editor
        if (after_cell_id === "" || after_cell_id == null)  {
            console.log(`Appending new code cell to editor`);
            DOM.addElement("editor", code_cell.getDiv()); 
        } else {  //Insert it after the id specified
            console.log(`Inserting new code cell after ${after_cell_id}`);
            // Since we confirmed above that there is a nextSibling, we want to make sure it's not this code's output cell.
            let nextCellId = DOM.getNextSiblingId(after_cell_id);
            // While the next cell is an output cell 
            if (DOM.getNextSiblingId(nextCellId) !== null && OutputCell.isOutputCellId(nextCellId)) {
                nextCellId = DOM.getNextSiblingId(nextCellId);
            }
            let editorDiv = document.getElementById("editor");
            editorDiv.insertBefore(code_cell.getDiv(), document.getElementById(nextCellId));
        }

       
        
        let editorObj = ObjectManager.getInstance().getObject("editor");
        editorObj.cc_id += 1;
        editorObj.active_code_cell_id = code_cell.id;

        console.log(`Code cell added. New cc_id: ${editorObj.cc_id }`);
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