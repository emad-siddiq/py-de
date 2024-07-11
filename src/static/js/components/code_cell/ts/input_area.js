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
        this.caretX = 0; /* |      -------------> X   InputArea[i, j] = this.grid[caretY, caretX] */
        this.caretY = -1; /* |                                                                     */
        this.addLine(this.caretY); /* ▼ Y is the line-number                                                */
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
    addLine(caretY, text) {
        let line_number = caretY + 2; //Since we initialize caretY at -1 so when we add the first line caretY = 0 = firstArr = firstRow
        let line = InputAreaEditor.createLine(this.id, line_number, text);
        this.div.appendChild(line);
        this.total_lines += 1;
        this.caretX = 1;
        this.caretY += 1;
    }
    getCodeAreaByLine(line_number) {
        let code_area_id = InputAreaEditor.getCodeAreaId(this.id, line_number);
        return document.getElementById(code_area_id);
    }
    removeLine(caretY) {
        let line_number = caretY + 1;
        delete this.grid[line_number];
        let line_number_id = this.id + "-line-number-" + line_number.toString();
        let code_area_id = line_number_id + "-text";
        removeElement(code_area_id);
        removeElement(line_number_id);
        InputAreaEditor.decreaseCodeCellSize(this.div);
        this.caretY -= 1;
        this.caretX = this.grid[this.caretY].length - 1;
        let prev_code_area = this.getCodeAreaByLine(caretY + 1);
        InputAreaEditor.moveCaretToEndOfCodeArea(prev_code_area);
    }
    addEventListeners() {
        this.div.addEventListener("keydown", this.handleInput.bind(this));
        this.div.addEventListener("click", this.initialClick.bind(this));
    }
    initialClick() {
        //Move caret to start of input area.
        this.div.focus();
        let first_line_code_area_id = InputAreaEditor.getCodeAreaId(this.id, this.caretY + 1);
        let first_line_code_area = document.getElementById(first_line_code_area_id);
        if (first_line_code_area) {
            this.moveCaretToBeginningOfCodeArea(first_line_code_area);
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
            this.addToGrid("\n");
            InputAreaEditor.increaseCodeCellSize(this.div);
            this.removeDefaultBr(); //contenteditable adds <br> on pressing entering
            this.addLine(this.caretY);
            let new_line_code_area_id = InputAreaEditor.getCodeAreaId(this.id, this.caretY + 1); //since line number = caretY + 1
            let new_line_code_area = document.getElementById(new_line_code_area_id);
            if (new_line_code_area) {
                this.moveCaretToBeginningOfCodeArea(new_line_code_area);
            }
        }
        else if (e.code === "Backspace" || e.code === "Delete") { // for backspace 
            let startOfLine = this.caretX === 1;
            let firstLine = this.caretY === 0;
            if (startOfLine) {
                if (firstLine) {
                    //Can't delete since beginning of first line
                    return;
                }
                this.removeLine(this.caretY);
            }
            else {
                this.caretX -= 1;
                this.removeFromGrid();
                console.log(e.currentTarget);
            }
        }
        else if (e.code === "Space") {
            this.addToGrid(e.key);
            this.caretX += 1;
        }
        else {
            this.addToGrid(e.key);
            this.caretX += 1;
            console.log(this.grid);
            console.log("target", e.currentTarget);
            let curr_code_area = this.getCodeAreaByLine(this.caretY + 1);
            console.log(curr_code_area);
            if (curr_code_area) {
                InputAreaEditor.moveCaretToEndOfCodeArea(curr_code_area);
            }
        }
    }
    addToGrid(char) {
        if (this.grid[this.caretY]) {
            console.log(this.caretX, this.caretY, char);
            this.grid[this.caretY][this.caretX] = char;
        }
        else {
            this.grid[this.caretY] = [];
            this.grid[this.caretY][this.caretX] = char;
        }
        this.renderEditableContentArea(this.caretY);
    }
    removeFromGrid() {
        let line = this.grid[this.caretY];
        let before_char = line.slice(0, this.caretX);
        let after_char = line.slice(this.caretX + 1, line.length);
        this.grid[this.caretY] = before_char.concat(after_char);
        this.renderEditableContentArea(this.caretY);
    }
    renderEditableContentArea(caretY) {
        var _a;
        let line_number = caretY + 1;
        let code_area = document.getElementById(InputAreaEditor.getCodeAreaId(this.id, line_number));
        if (code_area) {
            code_area.innerText = (_a = this.grid[caretY]) === null || _a === void 0 ? void 0 : _a.join('');
        }
    }
    moveCaretToBeginningOfCodeArea(code_area) {
        var _a, _b;
        let textNode = code_area.childNodes[0];
        let startNode = textNode;
        let startOffset = 0;
        let endNode = textNode;
        let endOffset = ((_a = textNode === null || textNode === void 0 ? void 0 : textNode.textContent) === null || _a === void 0 ? void 0 : _a.length) ? (_b = textNode === null || textNode === void 0 ? void 0 : textNode.textContent) === null || _b === void 0 ? void 0 : _b.length : startOffset;
        InputAreaEditor.moveSelection(startNode, startOffset, endNode, endOffset, true);
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
