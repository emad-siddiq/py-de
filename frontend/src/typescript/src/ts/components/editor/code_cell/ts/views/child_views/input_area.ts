// File: src/ts/components/editor/code_cell/ts/views/child_views/input_area.ts

import {InputAreaEditor} from "../../controllers/input_area_controller";
import { DarkMode } from "../../../../../../themes/darkmode/darkmode";
import { InputAreaKeyDown } from "../../handlers/keydown_handler";
import { ObjectManager } from "../../../../../../managers/object_manager";

class InputArea {
    id: string;
    caretX: number;
    caretY: number;
    total_lines: number;
    div: HTMLElement;
    grid: {[key: number]: string[]};
    line_number: string;
    allSelected: boolean;
    cc_id: number;
    private socket: WebSocket | null;

    constructor(id: string, cc_id: number) {
        this.id = id;
        this.div = InputAreaEditor.createInputArea(this.id);
        this.div = this.addEventListeners(this.div);
        this.total_lines = 0;
        this.grid = {};
        this.cc_id = cc_id;
        this.socket = null;
        this.caretX = 0;
        this.caretY = 0;
        this.allSelected = false;

        // Subscribe to socket updates
        ObjectManager.getInstance().subscribeToSocket("codeSocket", this.updateSocket.bind(this));

        // Add the first line
        this.addLineAfter(-1);
    }

    public updateSocket(newSocket: WebSocket) {
        this.socket = newSocket;
        console.log(`InputArea ${this.id} updated with new WebSocket`);
    }

    getDiv() {
        return this.div;
    }

    addLineAfter(afterLineNumber: number, text?: string): void {
        console.log(`addLineAfter called with afterLineNumber: ${afterLineNumber}, text: ${text}`);
        console.log(`Current state - caretY: ${this.caretY}, total_lines: ${this.total_lines}`);
        
        const newLineNumber = afterLineNumber + 1;
        
        if (newLineNumber < 0 || newLineNumber > this.total_lines) {
            console.error(`Invalid new line number: ${newLineNumber}. Total lines: ${this.total_lines}`);
            return;
        }

        this.total_lines += 1;
        let line = InputAreaEditor.createLine(this.id, newLineNumber + 1, text);

        try {
            let input_area = this.div;

            if (input_area.children.length === 0) {
                input_area.appendChild(line);
            } else if (newLineNumber === 0) {
                input_area.insertBefore(line, input_area.firstChild);
            } else {
                let line_before_id = InputAreaEditor.generateLineContainerId(this.id, newLineNumber);
                let line_before = document.getElementById(line_before_id);
                
                if (!line_before) {
                    console.warn(`Line before (id: ${line_before_id}) not found. Appending to the end.`);
                    input_area.appendChild(line);
                } else {
                    input_area.insertBefore(line, line_before.nextSibling);
                }
            }

            // Update line numbers for all lines
            this.updateLineNumbers();

            this.caretY = newLineNumber;
            this.caretX = 0;

            // Ensure the grid is updated
            if (!this.grid[this.caretY]) {
                this.grid[this.caretY] = text ? text.split('') : [];
            }

            console.log(`Line added. New total_lines: ${this.total_lines}, New caretY: ${this.caretY}`);
        } catch (error) {
            console.error(`Error in addLineAfter: ${error.message}`);
            console.error(`Stack trace: ${error.stack}`);
        }
    }

    updateLineNumbers(): void {
        let input_area = document.getElementById(this.id);
        if (!input_area) return;

        let lines = input_area.children;
        for (let i = 0; i < lines.length; i++) {
            let line_number_div = lines[i].querySelector('div');
            if (line_number_div) {
                line_number_div.textContent = (i + 1) + '.';
            }
        }
    }

    removeLine(caretY: number) {
        let line_number = caretY + 1;
        delete this.grid[line_number];

        let line_container_id = InputAreaEditor.generateLineContainerId(this.id, line_number);
        removeElement(line_container_id);
        this.decreaseHeight();

        if (this.caretY !== 0) {
            let prev_code_area = this.getCodeAreaByLine(line_number - 1);
            InputAreaEditor.moveCaretToIndexOfCodeArea(prev_code_area, prev_code_area.textContent.length);    
            this.caretY -= 1;  
            this.caretX = this.grid[this.caretY] ? this.grid[this.caretY].length - 1 : 0; 
        }

        this.total_lines -= 1;
        this.updateLineNumbers();
    }

    addEventListeners(div: HTMLElement): HTMLElement {
        div.addEventListener("keydown", this.handleInput.bind(this));
        div.addEventListener("click", this.handleClick.bind(this));
        return div;
    }

    getCodeAreaByLine(line_number: number): HTMLElement | null {
        let code_area_id = InputAreaEditor.getCodeAreaId(this.id, line_number);
        return document.getElementById(code_area_id);
    }

    addToGrid(char: string) {
        if (!this.grid[this.caretY]) {
            this.grid[this.caretY] = [];
        }
        this.grid[this.caretY][this.caretX] = char;
        this.renderLine(this.caretY + 1);
    }

    removeCharFromLine(): void {
        let line = this.grid[this.caretY];
        if (line) {
            let before_char = line.slice(0, this.caretX);
            let after_char = line.slice(this.caretX + 1);
            this.grid[this.caretY] = before_char.concat(after_char);
            this.renderLine(this.caretY + 1);
            let code_area = this.getCodeAreaByLine(this.caretY + 1);
            InputAreaEditor.moveCaretToIndexOfCodeArea(code_area, this.caretX - 1);
            this.caretX = Math.max(0, this.caretX - 1);
        }
    }

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
        if (code_area) {
            let code_area_text = this.grid[line_number - 1]?.join('') || '';
            code_area.textContent = code_area_text;
        }
    }

    removeDefaultBr() {
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
        let first_line_code_area = this.getCodeAreaByLine(this.caretY + 1);
        if (first_line_code_area && first_line_code_area.textContent.length > 0) {
            return true;
        }
        console.log(e.clientX, e.clientY, first_line_code_area?.getBoundingClientRect());

        if (first_line_code_area) {
            InputAreaEditor.moveCaretToEndOfCodeArea(first_line_code_area);
        } else {
            // TODO implement logic to handle click on earlier line in code area
        }
    }

    handleInput(e: KeyboardEvent): void {
        console.log("INPUT", e.code, e.key, e.shiftKey, e.ctrlKey, e.altKey);
                        
        if (e.shiftKey && e.key === 'Enter') {
            console.log("Input received");
            e.preventDefault();
            e.stopPropagation();
            if (this.socket) {
                this.socket.send(this.exportCode());
                console.log("Sending", this.exportCode());
            } else {
                console.error("WebSocket is not available");
            }
            return;
        }
    
        else if (e.code === "Enter") {
            InputAreaKeyDown.Enter(e, this);
        }
        else if (e.key === "F1") {
            InputAreaKeyDown.F1(e, this);
        }
        else if (e.shiftKey && e.code === "Tab") {
            InputAreaKeyDown.ShiftTab(e, this);
        }
        else if (e.code === "Tab") {
            InputAreaKeyDown.Tab(e, this);
        }
        else if (e.code === "Backspace" || e.code === "Delete") {
            InputAreaKeyDown.Backspace(e, this);
        } 
        else if (e.code === "Space") {
            InputAreaKeyDown.Space(e, this);
        }
        else if (e.metaKey || e.ctrlKey) {
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
            let curr_code_area = this.getCodeAreaByLine(this.caretY + 1);
            if (curr_code_area) {
                InputAreaEditor.moveCaretToIndexOfCodeArea(curr_code_area, this.caretX);
            }
        }
    }

    exportCode(): string {
        console.log("Exporting code, current grid:", this.grid);
        let out = "";
        const gridKeys = Object.keys(this.grid).map(Number).sort((a, b) => a - b);
        for (let i of gridKeys) {
            if (this.grid[i] && Array.isArray(this.grid[i])) {
                out += this.grid[i].join('') + "\n";
            } else {
                out += "\n";
            }
        }
        console.log("Exported code:", out);
        return out;
    }
}

function removeElement(id: string) {
    var elem = document.getElementById(id);
    return elem?.parentNode?.removeChild(elem);
}

export { InputArea };