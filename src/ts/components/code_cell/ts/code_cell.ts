import {InputArea} from "./input_area.js";
import { CodeCellNumber } from "./cell_number.js";

class CodeCell {
    // TODO: Add color syntax highlighting to CodeCell
    // TODO: Add line numbering to code editor
    socket: WebSocket;
    id: string;
    cc_id: number;
    name: string;
    input_area_id: string;
    div: HTMLElement;
    input_area: InputArea;
    code_cell_number: CodeCellNumber;


    constructor(id, socket) 
    {
        // Socket to send code to run
        this.socket = socket;

        // class name, css id
        this.name = "code-cell";
        this.id = "code-cell-"+id.toString();
        this.cc_id = id;
        this.input_area_id = this.id + "-input-area";

        //Text processing
        this.div = this.createCodeCellDiv();
        this.addEventListeners(this.div);
    }

    getDiv() 
    {  
        return this.div;
    }

    addEventListeners(div) {
       div.addEventListener("keydown", this.sendOnShiftEnter.bind(this));
    }

    createCodeCellDiv() {
        let code_cell = document.createElement("div");
        code_cell.setAttribute("id", this.id);
        code_cell.setAttribute("class", this.id);
        code_cell.style.left = "0%";
        code_cell.style.top = "0%";

        code_cell.style.width = "100%";
        code_cell.style.height = "70px";
        code_cell.style.overflow = "visible";
        code_cell.style.boxSizing = "border-box";
        code_cell.style.position = "relative";

        //code_cell.style.border = "solid 4px";
        this.code_cell_number = new CodeCellNumber(this.cc_id);
        this.input_area = new InputArea(this.id);

        code_cell.appendChild(this.code_cell_number.getDiv());
        code_cell.appendChild(this.input_area.getDiv());

        return code_cell;
    }

    sendOnShiftEnter(e: KeyboardEvent) {
        if (e.shiftKey && e.key === 'Enter') {
            this.socket.send(this.div.textContent);
            return;
        }
    }


   
}




  

export {CodeCell};