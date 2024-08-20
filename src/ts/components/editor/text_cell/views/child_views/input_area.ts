import {InputAreaEditor} from "../../controllers/input_area_controller.js";
import { DarkMode } from "../../../../../themes/darkmode/darkmode.js";
import { InputAreaKeyDown } from "../../handlers/keydown_handler.js";
import { removeElement} from "../../../../../utility/dom.js";

class InputArea {

    id: string;
    caretX: number;
    caretY: number;
    total_lines: number;
    div: HTMLElement;
    grid: Object;
    line_number: string;
    allSelected: boolean;

    constructor(id) {
        this.id = id;
        this.div = InputAreaEditor.createInputArea(this.id);
        this.div = this.addEventListeners(this.div);
        this.total_lines = 0;
        this.grid = {};
        //Out of grid starting area
        this.caretX = -1;                    /* |      -------------> X   InputArea[i, j] = this.grid[caretY, caretX] */
        this.caretY = -1;                    /* |                                                                     */
                                             /* ▼ Y is the line-number                                                */    }

    getDiv() {
        return this.div;
    }

     static  createInputArea(id: string): HTMLElement {
        let input_area = document.createElement("div");

        input_area.setAttribute("contenteditable", "true");
        input_area.setAttribute("id", id);
        input_area.setAttribute("class", id);
        input_area.setAttribute("spellcheck", "false");

        //let randColor = '#'+(Math.random()*0xFFFFFF<<0).toString(16);
        input_area.style.backgroundColor = "white"; //TODO extract to theme
        input_area.style.zIndex = "2";
        input_area.style.position = "absolute";
        input_area.style.top = "0";
        input_area.style.left = "10";
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
    addLineAfter(after: number, text?: string): void {

        this.caretY += 1;  //Move caret to next line
        this.caretX = 0;   //Move caret to beginning of line

        let line_number = this.caretY+1; // caretY starts at 0 
        let line = InputAreaEditor.createLine(this.id, line_number, text);

        let input_area = document.getElementById(this.id);
        // Add line after line_to_add_after otherwise append line to empty input_area
        if (input_area.children.length !== 0) {
            let line_to_add_after_id = InputAreaEditor.generateLineContainerId(this.id, after);
            let line_to_add_after = document.getElementById(line_to_add_after_id);
            let node = line_to_add_after.nextSibling ? line_to_add_after.nextSibling : undefined;
            input_area.insertBefore(line, node);
        }
       
        else {
            input_area.append(line);
        }
   
        this.total_lines += 1;

        
    
    }

    removeLine(caretY: number) {
        let line_number  = caretY + 1;
        delete this.grid[line_number];

        let line_container_id = InputAreaEditor.generateLineContainerId(this.id, line_number);
        removeElement(line_container_id);
        this.decreaseHeight();

        if (this.caretY !== 0) {
            let prev_code_area = this.getCodeAreaByLine(line_number-1);
            InputAreaEditor.moveCaretToIndexOfCodeArea(prev_code_area, prev_code_area.textContent.length);    
            this.caretY -= 1;  
            this.caretX = this.grid[this.caretY] ? this.grid[this.caretY].length - 1: 0; 
        }

        this.total_lines -= 1;

    }


    addEventListeners(div: HTMLElement):HTMLElement {
        
        div.addEventListener("keydown", this.handleInput.bind(this));
        div.addEventListener("click", this.handleClick.bind(this));

        return div;

    }

    getCodeAreaByLine(line_number: number): HTMLElement | null {
        let code_area_id = InputAreaEditor.getCodeAreaId(this.id, line_number);
        return document.getElementById(code_area_id);
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


    /*
        Adds a string numOftimes to the the current line (this.caretY+1);
    */
    addString(str: string, numOfTimes: number) {
        let code_area = this.getCodeAreaByLine(this.caretY + 1);

        for (let i = 0; i < numOfTimes; i++) {
            for (let j = 0; j < str.length; j++) {
                this.caretX += 1;
                this.addToGrid(str[j]);
            }
        }
        InputAreaEditor.moveCaretToIndexOfCodeArea(code_area, this.caretX);
    }
            

    renderLine(line_number: number) {
        let code_area = this.getCodeAreaByLine(line_number);
        if(code_area) {
            let code_area_text = this.grid[line_number-1]?.join('');
            code_area.textContent = code_area_text;
        }
    }


    removeDefaultBr() {
        //TODO only remove break from previous code cell
        let br = document.querySelector('br');
        br?.remove();
    }

    increaseHeight() {
        InputAreaEditor.increaseCodeCellHeight(this.div);
    }

    decreaseHeight() {
        InputAreaEditor.decreaseCodeCellHeight(this.div);
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


    handleInput(e: KeyboardEvent):void {
        // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code 

        console.log("INPUT", e.code, e.key, e.shiftKey, e.ctrlKey, e.altKey);
                        
        if (e.code === "Enter") {
            InputAreaKeyDown.Enter(e, this);
        }

        else if (e.key === "F1") {
            InputAreaKeyDown.F1(e, this);
        }
        
        // TODO these two cases should indent properly
        else if (e.shiftKey && e.code === "Tab") {
            InputAreaKeyDown.ShiftTab(e, this);
        }

        else if (e.code === "Tab") {
            InputAreaKeyDown.Tab(e, this);
        }
         
        else if (e.code === "Backspace" || e.code === "Delete") { // for backspace 
            InputAreaKeyDown.Backspace(e, this);
        } 

        else if (e.code === "Space") {
          InputAreaKeyDown.Space(e, this);
        }

        else if  (e.metaKey || e.ctrlKey) {
           InputAreaKeyDown.Ctrl(e, this);
        }
        else if (e.shiftKey) {
            if (InputAreaEditor.isAlphaNumericChar(e.key) || InputAreaEditor.isSpecialChar(e.key)) { 
                InputAreaKeyDown.AlphaNumericSpecial(e, this);
            }
        }
        

        else {
            console.log("Not caught code:", e.code, " key " , e.key);
            
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



export {InputArea};