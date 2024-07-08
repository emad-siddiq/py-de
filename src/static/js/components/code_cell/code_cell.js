import { fourSpacesOnTab, getCaretCharOffset } from "../../node/cells/utility.js";
import { InputArea } from "./input_area.js";
import { CodeCellNumber } from "./cell_number.js";
import { LineNumberColumn } from "./line_number_column.js";

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
        this.id_number = id;
        this.id = this.name + "-" + id.toString();
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
        div.addEventListener("keydown", this.handleCodeCellInput.bind(this));
        div.addEventListener("keydown", fourSpacesOnTab);
       
    }

    createCodeCellDiv() {
        let code_cell = document.createElement("div");
        code_cell.setAttribute("id", this.id);
        code_cell.setAttribute("class", this.id);
        code_cell.style.left = "0%";
        code_cell.style.top = "0%";

        code_cell.style.width = "100%";
        code_cell.style.height = "80px";
        code_cell.style.overflow = "auto";
        code_cell.style.boxSizing = "border-box";
        code_cell.style.position = "relative";
        code_cell.style.marginTop = "-20px";

        //code_cell.style.border = "solid 4px";
        let code_cell_number = new CodeCellNumber(this.id);
        let line_number_column = new LineNumberColumn(this.id);
        let input_area = new InputArea(this.id);

        code_cell.appendChild(code_cell_number.getDiv());
        code_cell.appendChild(line_number_column.getDiv());

        code_cell.appendChild(input_area.getDiv());
        return code_cell;
    }






    
    /******************************************************************
                       Code Cell Textual Processing
    *******************************************************************/ 

    handleCodeCellInput(e) {
        // this = CodeCell class, e.target = <div id="code-cell-1">
        // Do textprocessing with line number and figure out new height

        if (e.shiftKey && e.key === 'Enter') {
            this.blur()
            this.socket.send(this.value)
            return;
           }
    
        let line_height = () => {
            return parseInt(
                window.getComputedStyle(
                    document.getElementById(this.id + "-input-area")).
                    getPropertyValue("font-size")
                );
          };

    
        if (e.code === "Enter") {
            this.addLineNumber();
            this.line_count += 1;
            console.log("Line count= ", this.line_count);
            let input_area = document.getElementById(this.id + "-input-area");
            let newHeight = input_area.getBoundingClientRect().height + line_height(input_area) + 3.1 + "px";

            console.log(line_height(input_area), newHeight);

            input_area.style.height = newHeight;
            e.currentTarget.style.height = document.getElementById(this.id).getBoundingClientRect().height + 4 + line_height(input_area) + "px";

        }
        
        if (e.code==="Backspace") { // for backspace 
            let input_area = document.getElementById(this.id + "-input-area");
            let index = getCaretCharOffset(input_area);

            let str = document.getElementById(this.id + "-input-area").innerText; // TODO: Backspace is buggy. change to innerHTML and handle
            console.log("str", str, str.length, index);

            for (let i = 0; i < str.length; i++) {
                console.log(i, str.charAt(i));
            }

            let deleted_char = str.charAt(index);
            console.log("deleted char", deleted_char);

    
            if (deleted_char === "\n") {
                console.log("newline deleted");
                e.currentTarget.style.height = e.currentTarget.getBoundingClientRect().height - line_height(e.currentTarget);
                let line_number_div = document.getElementById("line-number-div")
                let last_line_number = line_number_div.children[line_number_div.children.length-1];
                console.log(last_line_number);
                document.getElementById("line-number-div").removeChild(last_line_number);
            }
          
        }

    
    
    }
   
}




  

export {CodeCell};