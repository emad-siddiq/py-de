import { InputAreaEditor } from "./input_area_controller.js";
class InputArea {
    constructor(parentId) {
        this.id = parentId + "-input-area";
        this.div = this.createInputArea();
        this.addEventListeners();
        this.curr_caret_line = 1;
        this.total_lines = 0;
        this.grid = {};
        //Out of grid starting area
        this.caretX = -1; /* |      -------------> X   InputArea[i, j] = this.grid[caretY, caretX] */
        this.caretY = -1; /* |                                                                     */
        this.addLineAfter(this.caretY); /* ▼ Y is the line-number                                                */
        /* grid[i, 0] is reserved for line_number */
    }
    getDiv() {
        return this.div;
    }
    /*
      Creates and returns div for input area
    */
    createInputArea(id) {
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
    addLineAfter(caretY, text) {
        this.caretX = 0;
        this.caretY = caretY + 1;
        let line_number = this.caretY + 1; //Since we initialize caretY at 0 so line = caretY + 1 since line starts at 1
        let line = InputAreaEditor.createLine(this.id, line_number, text);
        this.div.appendChild(line);
        this.total_lines += 1;
    }
    getCodeAreaByLine(line_number) {
        let code_area_id = InputAreaEditor.getCodeAreaId(this.id, line_number);
        return document.getElementById(code_area_id);
    }
    removeLine(caretY) {
        let line_number = caretY + 1;
        delete this.grid[line_number];
        let line_container_id = InputAreaEditor.generateLineContainerId(this.id, line_number);
        removeElement(line_container_id);
        InputAreaEditor.decreaseCodeCellSize(this.div);
        if (this.caretY !== 0) {
            let prev_code_area = this.getCodeAreaByLine(line_number - 1);
            InputAreaEditor.moveCaretToIndexOfCodeArea(prev_code_area, prev_code_area.textContent.length);
            this.caretY -= 1;
            this.caretX = this.grid[this.caretY] ? this.grid[this.caretY].length - 1 : 0;
        }
    }
    addEventListeners() {
        this.div.addEventListener("keydown", this.handleInput.bind(this));
        this.div.addEventListener("click", this.handleClick.bind(this));
    }
    handleClick(e) {
        //Move caret to start of input area.
        let first_line_code_area = this.getCodeAreaByLine(this.caretY + 1);
        if (first_line_code_area.textContent.length > 0) {
            return true;
        }
        console.log(e.clientX, e.clientY, first_line_code_area.getBoundingClientRect());
        if (first_line_code_area) {
            InputAreaEditor.moveCaretToEndOfCodeArea(first_line_code_area);
            // first_line_code_area.textContent = "";
        }
        else {
            // TODO implement logic to handle click on earlier line in code area
        }
    }
    handleInput(e) {
        // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code 
        // this = InputArea class, e.target = <div id="code-cell-1-input-area">
        // Do textprocessing with line number and figure out new height
        //document.getSelection().collapseToEnd();
        e.preventDefault();
        e.stopPropagation();
        if (e.code === "Enter") {
            this.removeDefaultBr(); //contenteditable adds <br> on pressing entering
            InputAreaEditor.increaseCodeCellSize(this.div);
            this.addLineAfter(this.caretY);
            let new_code_area = this.getCodeAreaByLine(this.caretY + 1);
            InputAreaEditor.moveCaretToBeginningOfCodeArea(new_code_area);
        }
        else if (e.code === "Backspace" || e.code === "Delete") { // for backspace 
            let startOfLine = this.caretX === 0;
            let firstLine = this.caretY === 0;
            if (startOfLine) {
                if (firstLine) {
                    //Can't delete since beginning of first line
                    return;
                }
                this.removeLine(this.caretY);
            }
            else {
                this.removeCharFromLine();
            }
        }
        else if (e.code === "Space") {
            this.caretX += 1;
            this.addToGrid(" ");
            let code_area = this.getCodeAreaByLine(this.caretY + 1);
            console.log(code_area.innerHTML.length, this.caretX);
            InputAreaEditor.moveCaretToIndexOfCodeArea(code_area, this.caretX);
        }
        else {
            this.caretX += 1;
            this.addToGrid(e.key);
            let curr_code_area = this.getCodeAreaByLine(this.caretY + 1);
            if (curr_code_area) {
                InputAreaEditor.moveCaretToIndexOfCodeArea(curr_code_area, this.caretX);
            }
        }
    }
    addToGrid(char) {
        if (this.grid[this.caretY]) {
            this.grid[this.caretY][this.caretX] = char;
        }
        else {
            this.grid[this.caretY] = [];
            this.grid[this.caretY][this.caretX] = char;
        }
        this.renderLine(this.caretY + 1);
    }
    removeCharFromLine() {
        let line = this.grid[this.caretY];
        let before_char = line.slice(0, this.caretX);
        let after_char = line.slice(this.caretX + 1, line.length);
        this.grid[this.caretY] = before_char.concat(after_char);
        this.renderLine(this.caretY + 1);
        let code_area = this.getCodeAreaByLine(this.caretY + 1);
        InputAreaEditor.moveCaretToIndexOfCodeArea(code_area, this.caretX - 1);
        this.caretX -= 1;
    }
    renderLine(line_number) {
        var _a;
        let code_area = this.getCodeAreaByLine(line_number);
        if (code_area) {
            let code_area_text = (_a = this.grid[line_number - 1]) === null || _a === void 0 ? void 0 : _a.join('');
            code_area.textContent = code_area_text;
            //code_area.innerHTML = code_area_text;
            console.log("code_area", code_area_text, code_area_text.length, code_area);
        }
    }
    removeDefaultBr() {
        let br = document.querySelector('br');
        br === null || br === void 0 ? void 0 : br.remove();
    }
}
function removeElement(id) {
    var _a;
    var elem = document.getElementById(id);
    return (_a = elem === null || elem === void 0 ? void 0 : elem.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(elem);
}
export { InputArea };
