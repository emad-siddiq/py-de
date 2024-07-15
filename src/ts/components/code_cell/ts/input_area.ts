import {InputAreaEditor} from "./input_area_controller.js";

class InputArea {

    id: string;
    caretX: number;
    caretY: number;
    curr_caret_line: number;
    total_lines: number;
    div: HTMLElement;
    grid: Object;
    line_number: string;

    constructor(parentId) {
        this.id = parentId + "-input-area";
        this.div = this.createInputArea();
        this.addEventListeners();
        this.curr_caret_line = 1;
        this.total_lines = 0;
        this.grid = {};
        //Out of grid starting area
        this.caretX = -1;                    /* |      -------------> X   InputArea[i, j] = this.grid[caretY, caretX] */
        this.caretY = -1;                   /* |                                                                     */
        this.addLineAfter(this.caretY);          /* ▼ Y is the line-number                                                */
                                            /* grid[i, 0] is reserved for line_number */
    }

    getDiv() {
        return this.div;
    }
    /* 
      Creates and returns div for input area 
    */
    createInputArea(id?: string): HTMLElement {
        let input_area = document.createElement("div");

        input_area.setAttribute("contenteditable", "true");
        input_area.setAttribute("id", this.id);
        input_area.setAttribute("class", this.id);
        input_area.setAttribute("spellcheck", "false");

        //let randColor = '#'+(Math.random()*0xFFFFFF<<0).toString(16);
        input_area.style.backgroundColor = "white"; //TODO extract to theme
        input_area.style.zIndex = "2";
        input_area.style.position = "absolute";
        input_area.style.top = "10px";
        input_area.style.left = "3%";
        input_area.style.boxSizing = "border-box";
        input_area.style.paddingTop = "10px";
        input_area.style.textIndent = "0.5%";
        input_area.style.boxShadow = "0px 2px 15px 0px rgba(0, 0, 0, .1)";
        input_area.style.width = "96.25%";
        input_area.style.height = "40px";
        input_area.style.fontFamily = "ui-monospace,SFMono-Regular,\"SF Mono\",Menlo,Consolas,\"Liberation Mono\",monospace";

        return input_area;
    } 
    
    //Add <div><line-number-caretY> <text area></div> to input area
    addLineAfter(caretY: number, text?: string): void {

        this.caretX = 0;
        this.caretY = caretY + 1;

        let line_number = this.caretY+1; //Since we initialize caretY at 0 so line = caretY + 1 since line starts at 1
        let line = InputAreaEditor.createLine(this.id, line_number, text);
       
        this.div.appendChild(line);
        this.total_lines += 1;

        
    
    }




    removeLine(caretY: number) {
        let line_number  = caretY + 1;
        delete this.grid[line_number];

        let line_container_id = InputAreaEditor.generateLineContainerId(this.id, line_number);
        removeElement(line_container_id);
        InputAreaEditor.decreaseCodeCellSize(this.div);

        if (this.caretY !== 0) {
            let prev_code_area = this.getCodeAreaByLine(line_number-1);
            InputAreaEditor.moveCaretToIndexOfCodeArea(prev_code_area, prev_code_area.textContent.length);    
            this.caretY -= 1;  
            this.caretX = this.grid[this.caretY] ? this.grid[this.caretY].length - 1: 0; 
        }


    }


    addEventListeners():void {
        this.div.addEventListener("keydown", this.handleInput.bind(this));
        this.div.addEventListener("click", this.handleClick.bind(this));
    }

    getCodeAreaByLine(line_number: number): HTMLElement | null {
        let code_area_id = InputAreaEditor.getCodeAreaId(this.id, line_number);
        return document.getElementById(code_area_id);
    }

    handleClick(e) {
        //Move caret to start of input area.
        
        let first_line_code_area = this.getCodeAreaByLine(this.caretY+1);
        if (first_line_code_area.textContent.length > 0) {
            return true;
        }
        console.log(e.clientX, e.clientY, first_line_code_area.getBoundingClientRect());

        if (first_line_code_area) {
            InputAreaEditor.moveCaretToEndOfCodeArea(first_line_code_area);
           // first_line_code_area.textContent = "";
        } else {
            // TODO implement logic to handle click on earlier line in code area
        }
    }


    addToGrid(char: string) {
        if (this.grid[this.caretY]) {
            this.grid[this.caretY][this.caretX] = char;
        } else {
            this.grid[this.caretY] = []
            this.grid[this.caretY][this.caretX] = char;
        }
        this.renderLine(this.caretY+1);

    }

    removeCharFromLine():void {
        let line = this.grid[this.caretY];
        let before_char = line.slice(0, this.caretX);
        let after_char = line.slice(this.caretX+1, line.length);
        this.grid[this.caretY] = before_char.concat(after_char);
        this.renderLine(this.caretY+1);
        let code_area = this.getCodeAreaByLine(this.caretY + 1);
        InputAreaEditor.moveCaretToIndexOfCodeArea(code_area, this.caretX - 1);
        this.caretX -= 1;

    }

    renderLine(line_number: number) {
        let code_area = this.getCodeAreaByLine(line_number);
        if(code_area) {
            let code_area_text = this.grid[line_number-1]?.join('');
            code_area.textContent = code_area_text;
            //code_area.innerHTML = code_area_text;
          //  console.log("code_area", code_area_text, code_area_text.length, code_area);

        }
    }


    removeDefaultBr() {
        //TODO only remove break from previous code cell
        let br = document.querySelector('br');
        br?.remove();
    }

    handleInput(e: KeyboardEvent):void {
        // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code 


        // this = InputArea class, e.target = <div id="code-cell-1-input-area">
        // Do textprocessing with line number and figure out new height
    
        //document.getSelection().collapseToEnd();
                    
        if (e.code === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            this.removeDefaultBr(); //contenteditable adds <br> on pressing entering
           
            InputAreaEditor.increaseCodeCellSize(this.div);
          
            this.addLineAfter(this.caretY);
            let new_code_area = this.getCodeAreaByLine(this.caretY+1);
            InputAreaEditor.moveCaretToEndOfCodeArea(new_code_area);
        }

         
        else if (e.code === "Backspace" || e.code === "Delete") { // for backspace 
            e.preventDefault();
            e.stopPropagation();
           let startOfLine = this.caretX === 0;
           let firstLine = this.caretY === 0;
           if (startOfLine) {
                if (firstLine) {
                    //Can't delete since beginning of first line
                    return;
                }
                this.removeLine(this.caretY);
                
           } else {
                this.removeCharFromLine();
           }
        } 

        else if (e.code === "Space") {
            e.preventDefault();
            e.stopPropagation();
            this.caretX += 1;
            this.addToGrid(" ");
            let code_area = this.getCodeAreaByLine(this.caretY + 1);
            console.log(code_area.innerHTML.length, this.caretX);
            InputAreaEditor.moveCaretToIndexOfCodeArea(code_area, this.caretX);

        }

        else if  (e.metaKey || e.ctrlKey) {
        
            if (e.key === "a") {
                e.stopPropagation();
                e.preventDefault();

                //Create a range (a range is a like the selection but invisible)
                let selection = window.getSelection();
                selection?.removeAllRanges()


                for (let i=1; i <= Object.keys(this.grid).length; i++) {
                    let range = document.createRange();
                    let code_area = this.getCodeAreaByLine(i);
                    let text_area = code_area?.childNodes[0];
                    range.selectNode(text_area);
                    selection?.addRange(range);
                }


            }
        }
        else if (e.shiftKey) {
            if (InputAreaEditor.isAlphaNumericChar(e.key) || InputAreaEditor.isSpecialChar(e.key)) { 
                console.log("shift alphnuym", e.key);
                e.preventDefault();
                e.stopPropagation();
                this.caretX += 1;
                this.addToGrid(e.key);
                let curr_code_area = this.getCodeAreaByLine(this.caretY+1);
    
                if (curr_code_area) {
                    InputAreaEditor.moveCaretToIndexOfCodeArea(curr_code_area, this.caretX);
                }
            }
        }
        
        //If alphanumeric, increment caret and add key to code_area of current line.
        else if (InputAreaEditor.isAlphaNumericChar(e.key)) { 
            e.preventDefault();
            e.stopPropagation();
            this.caretX += 1;
            this.addToGrid(e.key);

            let curr_code_area = this.getCodeAreaByLine(this.caretY+1);

            if (curr_code_area) {
                InputAreaEditor.moveCaretToIndexOfCodeArea(curr_code_area, this.caretX);
            }

        }

       


        else {
            console.log("Not caught code:", e.code, " key " , e.key);
            if (e.shiftKey) {
                console.log("Shift Key")
            } else {
                e.preventDefault();
                e.stopPropagation();
                this.caretX += 1;
                this.addToGrid(e.key);
                let curr_code_area = this.getCodeAreaByLine(this.caretY+1);
                if (curr_code_area) {
                    InputAreaEditor.moveCaretToIndexOfCodeArea(curr_code_area, this.caretX);
                }
            }
          
        }
                
    }

}

function removeElement(id: string) {
    var elem = document.getElementById(id);
    return elem?.parentNode?.removeChild(elem);
}

export {InputArea};