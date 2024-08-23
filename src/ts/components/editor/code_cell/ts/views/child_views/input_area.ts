// TODO: add text highlighting functionality
// TODO: add color syntax
import {InputAreaEditor} from "../../controllers/input_area_controller.js";
import { DarkMode } from "../../../../../../themes/darkmode/darkmode.js";
import { InputAreaKeyDown } from "../../handlers/keydown_handler.js";
import { WebSocketClient } from "../../../../../ws_client/ws_client.js";

class InputArea {

    id: string;
    caretX: number;
    caretY: number;
    total_lines: number;
    div: HTMLElement;
    grid: Object;
    line_number: string;
    allSelected: boolean;
    cc_id: number;
    socket: WebSocket;

    constructor(id, cc_id, socket) {
        this.id = id;
        this.div = InputAreaEditor.createInputArea(this.id);
        this.div = this.addEventListeners(this.div);
        this.total_lines = 0;
        this.grid = {};
        this.cc_id = cc_id;
        this.socket = socket;
        //Out of grid starting area
        this.caretX = -1;                    /* |      -------------> X   InputArea[i, j] = this.grid[caretY, caretX] */
        this.caretY = -1;                    /* |                                                                     */
                                             /* ▼ Y is the line-number                                                */    }

    getDiv() {
        return this.div;
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

    //"""Returns the code area associated with a line number inside a Code Cell"""
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
                        
        if (e.shiftKey && e.key === 'Enter') {
            console.log("INput received");
            this.socket.send(this.exportCode());
            console.log("Sending", this.exportCode());
            return;
        }
    
        
        else if (e.code === "Enter") {
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


    exportCode():string {
        console.log(this.grid);
        let out = "";
        for (let i = 0; i < Object.keys(this.grid).length; i++) {
            for (let j = 0; j < this.grid[i].length; j++) {
                out += this.grid[i][j];
            }
            out += "\n";
        }

        return out;
    }


}

function removeElement(id: string) {
    var elem = document.getElementById(id);
    return elem?.parentNode?.removeChild(elem);
}



export {InputArea};