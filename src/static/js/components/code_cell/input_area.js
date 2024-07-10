import {InputAreaEditor} from "./input_area_controller.js";

class InputArea {

    constructor(parentId) {
        this.id = parentId + "-input-area";
        this.div = this.createInputArea();
        this.addEventListeners();
        this.last_line_edited = 1;
        this.total_lines = 1;
        this.grid = {};

        this.caretX = 1;   /* |      -------------> X   InputArea[i, j] = this.grid[caretY, caretX] */
        this.caretY = 0;   /* |                                                                     */
        this.addLine(this.caretY);    /* ▼ Y is the line-number                                                */
                           /* grid[i, 0] is reserved for line_number */
    }

    getDiv() {
        return this.div;
    }

    getCurrLineNumber() {
        return this.line_number;
    }

    createInputArea(id) {
        let input_area = document.createElement("div");

        input_area.setAttribute("contenteditable", true);
        input_area.setAttribute("id", this.id);
        input_area.setAttribute("class", this.id);
        input_area.setAttribute("spellcheck", false);

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
    

    addLine(caretY, text) {
        let line_number = caretY + 1;
        let line = InputAreaEditor.createLine(this.id, line_number, text);
        this.div.appendChild(line);
        this.total_lines += 1;
       

    }


    removeLine(caretY) {
        let line_number  = caretY + 1;
        delete this.grid[line_number];
        let line_number_id = this.id + "-line-number-" + line_number.toString();
        let code_area_id = line_number_id + "-text";

        removeElement(code_area_id);
        removeElement(line_number_id);

        InputAreaEditor.decreaseCodeCellSize(this.div);
        this.caretY -= 1; 
        this.caretX = this.grid[this.caretY].length - 1;

        let prev_code_area = document.getElementById(this.id + "-line-number-" + caretY + "-text");
        
        this.moveCaretToEndOfNode(prev_code_area);

    }

    moveCaretToEndOfNode(node) {
        node.focus();
        console.log("NODE", node);
        let range = document.createRange();//Create a range (a range is a like the selection but invisible)
        range.setStart(node, 0);
        range.setEnd(node.childNodes[0], node.childNodes[0].data.length);
        console.log( range);
        range.collapse(false);       //collapse the range to the end point. false means collapse to end rather than the start
        let selection = window.getSelection();//get the selection object (allows you to change selection)
        selection.removeAllRanges();//remove any selections already made
        selection.addRange(range);//make the range you have just created the visible selection
        console.log(selection);

    }

    addEventListeners() {
        this.div.addEventListener("keydown", this.handleInput.bind(this));
        this.div.addEventListener("click", this.initialClick.bind(this));
    }

    initialClick() {
        //Move caret to start of input area.
        this.div.focus();
        document.execCommand('selectAll', false, null);
        document.getSelection().collapseToEnd();   
        this.initialClick = false;
    }

    handleInput(e) {
        // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code 
        // e.preventDefault();
        // e.stopPropagation();

        // this = InputArea class, e.target = <div id="code-cell-1-input-area">
        // Do textprocessing with line number and figure out new height
    
        //document.getSelection().collapseToEnd();
        e.preventDefault();

        e.stopPropagation();

        if (e.shiftKey && e.key === 'Enter') {
            this.blur()
            this.socket.send(this.value)
            return;
        }
                    
        else if (e.code === "Enter") {

            this.addToGrid("\n");
           
            InputAreaEditor.increaseCodeCellSize(this.div);
            this.caretX = 1;
            this.caretY += 1;
            this.addLine(this.caretY);
            return false;
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
           } else {
                this.caretX -= 1;
                this.removeFromGrid();
                console.log(e.currentTarget);
           }
          
        
        } 

        else if (e.code === "Space") {
            this.addToGrid(e.key);
            this.caretX += 1;
            this.renderContentEditable(this.caretY, false);

        }

        else if (e.code === "ArrowLeft") {
            this.caretX -= 1;
        }
        else if (e.code === "ArrowRight") {
            this.caretX += 1;
        }
        else if (e.code === "ArrowUp") {
            this.caretY -= 1;
        }
        else if (e.code === "ArrowDown") {
            this.caretY += 1;
        }

        else {
            this.addToGrid(e.key);
            
            this.caretX += 1;
            console.log(this.grid);
        }


                
    }

    addToGrid(char) {
        if (this.grid[this.caretY]) {
            console.log(this.caretX, this.caretY, char);
            this.grid[this.caretY][this.caretX] = char;
        } else {
            this.grid[this.caretY] = []
            this.grid[this.caretY][this.caretX] = char;
        }
        this.renderContentEditable(this.caretY, false);

    }

    removeFromGrid() {
        let line = this.grid[this.caretY];
        let before_char = line.slice(0, this.caretX);
        let after_char = line.slice(this.caretX+1, line.length);
        this.grid[this.caretY] = before_char.concat(after_char);
        this.renderContentEditable(this.caretY, true);
    }

    renderContentEditable(caretY, moveCaret) {
        let line_number = caretY + 1;
        let line_number_id = this.id + "-line-number-" + line_number.toString();
        let code_area_id = line_number_id + "-text";
        
        console.log(code_area_id);
       
        
        let code_area = document.getElementById(code_area_id);
        if (this.grid[caretY]) {
            code_area.innerText = this.grid[caretY].join('');

        }
        if (moveCaret) {
            this.moveCaretToEndOfNode(code_area);
        }
        console.log(line_number_id, code_area);

       
    
    }

   

       

}

function removeElement(id) {
    var elem = document.getElementById(id);
    return elem.parentNode.removeChild(elem);
}

export {InputArea};