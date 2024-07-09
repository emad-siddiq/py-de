import {InputAreaEditor} from "./input_area_controller.js";

class InputArea {

    constructor(parentId) {
        this.id = parentId + "-input-area";
        this.div = this.createInputArea();
        this.addEventListeners();
        this.line_number = 1;
        this.grid = {};

        this.caretX = 1;   /* |      -------------> X   InputArea[i, j] = this.grid[caretY, caretX] */
        this.caretY = 1;   /* |                                                                     */
        this.addLine();    /* ▼ Y is the line-number                                                */
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
    

    addLine() {
        let line = InputAreaEditor.createLine(this.id, this.line_number);
        this.div.appendChild(line);
        this.line_number += 1;
    }

    addEventListeners() {
        this.div.addEventListener("keydown", this.handleInput.bind(this));
        this.div.addEventListener("click", this.initialClick.bind(this));
    }

    initialClick() {
        this.div.focus();
        document.execCommand('selectAll', false, null);
     document.getSelection().collapseToEnd();
     console.log("CLICKCCSKC");
    }

    handleInput(e) {
        e.preventDefault();
        // this = InputArea class, e.target = <div id="code-cell-1-input-area">
        // Do textprocessing with line number and figure out new height
    
        //document.getSelection().collapseToEnd();

        if (e.shiftKey && e.key === 'Enter') {
            this.blur()
            this.socket.send(this.value)
            return;
        }
                    
        else if (e.code === "Enter") {
            this.addToGrid("\n");
            e.preventDefault();
            e.stopPropagation();
            InputAreaEditor.increaseCodeCellSize(this.div);
            this.addLine();
            this.div.focus();
            document.execCommand('selectAll', false, null);
            document.getSelection().collapseToEnd();
            this.caretY += 1;
            this.caretX = 1;
        }
         
        else if (e.code==="Backspace") { // for backspace 
           InputAreaEditor.decreaseCodeCellSize(this.div);

           this.caretX -= 1;
           this.caretY -= 1;
        
            
        } 

        else if (e.code === "ArrowLeft") {
            this.caretX -= 1;
        }
        else if (e.code === "ArrowRight") {
            this.caretX -= 1;
        }
        else if (e.code === "ArrowUp") {
            this.caretY -= 1;
        }
        else if (e.code === "ArrowDown") {
            this.caretY += 1;
        }

        else {
            this.addToGrid(e.key);
            this.addToContentEditable(e.key);
            this.div.focus();
            document.execCommand('selectAll', false, null);
            document.getSelection().collapseToEnd();
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
    }

    addToContentEditable(char) {

        for (const [key, value] of Object.entries(this.grid)) {
            console.log(`${key}: ${value.join('')}`);
            let id = this.id + "-line-number-" + key + "-code-area";
            console.log("code_area", id);
            let code_area = document.getElementById(id);
            code_area.innerText = value.join('');
          } 
    }

       

}

export {InputArea};