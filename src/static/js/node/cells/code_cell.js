import { fourSpacesOnTab } from "./textarea.js";

class CodeCell {

    constructor(id, socket) 
    {
        // Socket to send code to run
        this.socket = socket;

        // class name, css id
        this.name = "code-cell";
        this.id = this.name + "-" + id.toString();
        this.input_area_id = this.id + "-input-area";

        //Textprocessing
        this.line_count = 0;

        // child node generation & returning top level element
        this.childNodeFactory = [createInputArea];
        this.div = this.createCodeCellDiv();
        for (let createNode of this.childNodeFactory) {
            this.div.appendChild(createNode(this.id));
        }
        this.addEventListeners(this.div);
    }

    getDiv() 
    {  
        return this.div;
    }

    addEventListeners(div) {
        div.addEventListener("keydown", handleCodeCellInput.bind(this));
        div.addEventListener("keydown", sendOnShiftEnter);
        div.addEventListener("keydown", fourSpacesOnTab);
        this.makeBottomBoundaryResizeable(div);
    }

    createCodeCellDiv() {
        let code_cell = document.createElement("div");
        code_cell.setAttribute("id", this.id);
        code_cell.setAttribute("class", this.id);
        code_cell.style.width = "100%";
        code_cell.style.height = "35px";
        code_cell.style.boxSizing = "border-box";
        code_cell.style.position = "relative";
        return code_cell;
    }
    /**************************************************************** 
      If mouse dragged in resizeable div, set div height += △dy. 
    *****************************************************************/ 
    makeBottomBoundaryResizeable(div) {
    var drag = false;
    
    div.addEventListener("mousedown", function (e) {
        console.log("mousedown;")
        drag = true;
    });

    div.addEventListener("mousemove", function (e) {
    
    if (drag) {
        // Figure out height on drag. Should not hide text already in box.
        // New text area brought into view by dragging should be editable
        let bounds = this.getBoundingClientRect();     
        let newHeight = Math.max(bounds.height + e.movementY, );
        div.style.height = newHeight;
    }
    });

    document.body.addEventListener("mouseup", function (e) {
        console.log("mouseup")
            drag=false;
        });
}
    
}

function sendOnShiftEnter(event) {
    if (event.shiftKey && event.key === 'Enter') {
       this.blur()
       this.socket.send(this.value)
      }
}

function createInputArea(id) {
    let input_area = document.createElement("div");
    let input_area_id = id + "-input-area";

    input_area.setAttribute("contenteditable", true);
    input_area.setAttribute("id", input_area_id);
    input_area.setAttribute("class", input_area_id);

    let randColor = '#'+(Math.random()*0xFFFFFF<<0).toString(16);
    input_area.style.backgroundColor = randColor;
    input_area.style.zIndex = "2";
    input_area.style.position = "absolute";
    input_area.style.width = "100%";
    input_area.style.height = "100%";
    input_area.innerText = "hello";

    return input_area;
}

function handleCodeCellInput(e) {
    // Do textprocessing with line number and figure out new height
    let line_height = (code_cell) => {
        return parseInt(
            window.getComputedStyle(
                document.getElementById(this.id + "-input-area")).
                getPropertyValue("font-size")
            );
      };

    if (e.code === "Enter") {
        this.line_count += 1;
        console.log("Line count= ", this.line_count);
        console.log(e.target.parentNode.getBoundingClientRect().height + line_height(e.target));
        e.target.parentNode.style.height = e.target.parentNode.getBoundingClientRect().height + line_height(e.target);
    }
    
    if (e.code==="Backspace") { // for backspace 
        let index = getCaretCharOffset(e.target);
        let str = e.target.innerText;
        let deleted_char = str.charAt(index);

        if (deleted_char === "\n") {
            console.log("newline");
            e.target.parentNode.style.height = e.target.parentNode.getBoundingClientRect().height - line_height(e.target);

        }
      
      console.log(line_height);
    }

    
}

function getCaretCharOffset(element) {
    var caretOffset = 0;
  
    if (window.getSelection) {
      var range = window.getSelection().getRangeAt(0);
      var preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(element);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      caretOffset = preCaretRange.toString().length;
    } 
  
    else if (document.selection && document.selection.type != "Control") {
      var textRange = document.selection.createRange();
      var preCaretTextRange = document.body.createTextRange();
      preCaretTextRange.moveToElementText(element);
      preCaretTextRange.setEndPoint("EndToEnd", textRange);
      caretOffset = preCaretTextRange.text.length;
    }
  
    return caretOffset;
  }
  
  




export {CodeCell};