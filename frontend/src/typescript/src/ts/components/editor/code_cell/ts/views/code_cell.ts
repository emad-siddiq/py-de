import { InputArea } from "./child_views/input_area";
import { CodeCellNumber } from "./child_views/cell_number";
import { DarkMode } from "./../../../../../themes/darkmode/darkmode";
import { ObjectManager } from "../../../../../managers/object_manager";
import { DOM } from "./../../../../../utility/dom";
import { OutputCell } from "./../../../output_cell/output_cell";

class CodeCell {
    private socket: WebSocket | null;
    instance_id: string;
    code_cell_id: number;
    name: string;
    input_area_id: string;
    div: HTMLElement;
    input_area: InputArea;

    constructor(code_cell_id: number) {
        this.socket = null;

        this.name = "code-cell";
        this.instance_id = "code-cell-" + code_cell_id.toString();

        this.input_area_id = this.instance_id + "-input-area";
        this.code_cell_id = code_cell_id;
        this.input_area = new InputArea(this.input_area_id, this.code_cell_id);

        this.div = this.createCodeCellDiv();
        this.applyInitialStyles();
        this.addEventListeners(this.div);

        // Subscribe to socket updates
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

    addEventListeners(div: HTMLElement) {
        div.addEventListener("click", this.clickHandler.bind(this));
    }

    createCodeCellDiv() {
        let code_cell = document.createElement("div");
        code_cell.setAttribute("id", this.instance_id);
        code_cell.setAttribute("class", this.instance_id);

        code_cell.style.width = "100%";
        code_cell.style.height = "70px";
        code_cell.style.boxSizing = "border-box";
        code_cell.style.marginLeft = "5px";
        code_cell.style.marginTop = "10px";

        code_cell.style.display = "flex";
        code_cell.style.flexDirection = "row";

        code_cell.appendChild(this.createCodeCellNumberDiv());
        code_cell.appendChild(this.input_area.getDiv());

        return code_cell;
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
            this.div.style.boxShadow = "0px 5px 15px 5px rgba(20, 255, 60, 0.2)";
        } else {
            this.div.style.backgroundColor = "white";
            this.div.style.color = "black";
            this.div.style.boxShadow = "0px 2px 15px 0px rgba(0, 0, 0, 0.1)";
        }
    }

    clickHandler() {
        this.div.style.boxShadow = "0px 5px 15px 5px rgba(20, 255, 60, .2)";
        ObjectManager.getInstance().getObject("editor").updateActiveCell("code-cell", this.code_cell_id);


    }
}

export { CodeCell };