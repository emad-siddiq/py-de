// File: src/ts/components/editor/code_cell/ts/views/code_cell.ts

import { InputArea } from "./child_views/input_area";
import { CodeCellNumber } from "./child_views/cell_number";
import { DarkMode } from "./../../../../../themes/darkmode/darkmode";
import { ObjectManager } from "../../../../../managers/object_manager";

export class CodeCell {
    private socket: WebSocket | null;
    instance_id: string;
    code_cell_id: number;
    input_area_id: string;
    div: HTMLElement;
    input_area: InputArea;

    constructor(code_cell_id: number) {
        console.log(`Initializing CodeCell with id: ${code_cell_id}`);
        this.socket = null;
        this.code_cell_id = code_cell_id;
        this.instance_id = "code-cell-" + code_cell_id.toString(); 
        this.input_area_id = this.instance_id + "-input-area";
        
        this.createCodeCellDiv();
        this.input_area = new InputArea(this.input_area_id, this.code_cell_id);
        
        const inputAreaDiv = this.input_area.getDiv();
        this.div.appendChild(inputAreaDiv);

        setTimeout(() => {
            this.input_area.initializeCodeMirror();
        }, 0);

        this.applyInitialStyles();
        this.addEventListeners();

        ObjectManager.getInstance().subscribeToSocket("codeSocket", this.updateSocket.bind(this));
        ObjectManager.getInstance().associate(this.instance_id, this);
    }

    private updateSocket(newSocket: WebSocket) {
        this.socket = newSocket;
        console.log(`CodeCell ${this.instance_id} updated with new WebSocket`);
    }

    getDiv() {
        return this.div;
    }

    addEventListeners() {
        this.div.addEventListener("click", this.clickHandler.bind(this));
    }

    createCodeCellDiv() {
        this.div = document.createElement("div");
        this.div.setAttribute("id", this.instance_id);
        this.div.setAttribute("class", this.instance_id);

        this.div.style.width = "100%";
        this.div.style.minHeight = "50px";
        this.div.style.height = "auto";
        this.div.style.boxSizing = "border-box";
        this.div.style.marginLeft = "1vw";
        this.div.style.paddingLeft = "5px";

        this.div.style.marginTop = "10px";

        this.div.style.display = "flex";
        this.div.style.flexDirection = "row";

        const codeCellNumberDiv = this.createCodeCellNumberDiv();
        this.div.appendChild(codeCellNumberDiv);
    }

    createCodeCellNumberDiv() {
        let run_order = ObjectManager.getInstance().getObject("editor").run_order;
        let code_cell_number = new CodeCellNumber(run_order);
        return code_cell_number.getDiv();
    }

    applyInitialStyles() {
        if (DarkMode.enabled) {
            this.div.style.backgroundColor = "rgb(10, 15, 22)";
            this.div.style.color = "#FCF5F5";
            this.div.style.boxShadow = "0px 0px 8px rgba(243, 118, 38, 0.4)";            
        } else {
            this.div.style.backgroundColor = "white";
            this.div.style.color = "black";
            this.div.style.boxShadow = "0px 0px 8px rgba(243, 118, 38, 0.4)";            
        }
    }

    clickHandler() {
        //this.div.style.boxShadow = "0px 2px 2px 2px #64b5f6";
        ObjectManager.getInstance().getObject("editor").updateActiveCell("code-cell", this.code_cell_id);
    }

    updateHeight(height: number) {
        console.log(`Updating CodeCell ${this.instance_id} height to ${height}px`);
        this.div.style.height = `${height}px`;
        this.div.offsetHeight; // Trigger a layout update
    }
}