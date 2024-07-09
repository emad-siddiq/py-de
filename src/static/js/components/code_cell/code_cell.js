import { InputArea } from "./input_area.js";
import { CodeCellNumber } from "./cell_number.js";

class CodeCell {
    // TODO: Add color syntax highlighting to CodeCell
    // TODO: Add line numbering to code editor

    constructor(id, socket) 
    {
        // Socket to send code to run
        this.last_active_code_cell_id = "code-cell-1";
        this.socket = socket;

        // class name, css id
        this.name = "code-cell";
        this.id = id;
        this.divId = this.name + "-" + id.toString();
        this.input_area_id = this.id + "-input-area";

        //Text processing
        this.line_count = 0;
        this.drag = false;
        this.div = this.createCodeCellDiv();

        this.addEventListeners(this.div);
        this.boxShadow = [0, 5, 15, 5];
    }

    getDiv() 
    {  
        return this.div;
    }

    addEventListeners(div) {
       
    }

    createCodeCellDiv() {
        let code_cell = document.createElement("div");
        code_cell.setAttribute("id", this.divId);
        code_cell.setAttribute("class", this.divId);
        code_cell.style.left = "0%";
        code_cell.style.top = "0%";

        code_cell.style.width = "100%";
        code_cell.style.height = "70px";
        code_cell.style.overflow = "visible";
        code_cell.style.boxSizing = "border-box";
        code_cell.style.position = "relative";

        //code_cell.style.border = "solid 4px";
        this.code_cell_number = new CodeCellNumber(this.id);
        this.input_area = new InputArea(this.divId);

        code_cell.appendChild(this.code_cell_number.getDiv());
        code_cell.appendChild(this.input_area.getDiv());

        return code_cell;
    }



   
}




  

export {CodeCell};