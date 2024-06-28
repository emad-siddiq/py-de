
var id = 1;

function AddCodeCell() {
    //Assign counter to current code cell and increment counter.
    let code_cell_id= "code-cell-" + id.toString();
    id += 1;

    let code_cell = document.createElement("div");
    code_cell.setAttribute("id", code_cell_id);
    code_cell.setAttribute("class", code_cell_id);
    code_cell.style.width = "100%";
    code_cell.style.height = "35px";
    code_cell.style.boxSizing = "border-box";
    code_cell.style.position = "relative";

    let input_area = document.createElement("div");
    let input_area_id = code_cell_id + "-input-area";

    input_area.setAttribute("id", input_area_id);
    input_area.setAttribute("class", input_area_id);
    input_area.setAttribute("contenteditable", true);

    let randColor = '#'+(Math.random()*0xFFFFFF<<0).toString(16);
    input_area.style.backgroundColor = randColor;
    input_area.style.zIndex = "1";
    input_area.style.position = "absolute";
    input_area.style.width = "100%";
    input_area.style.height = "35px";
    input_area.innerText = "hello";

    input_area.addEventListener("input", handleCodeCellInput);
    input_area.addEventListener("keydown", sendOnShiftEnter);
    input_area.addEventListener("keydown", fourSpacesOnTab);

    let text_area = document.createElement("textarea");
    let text_area_id = code_cell_id + "-textarea";

    text_area.setAttribute("type", "text");
    text_area.setAttribute("id", text_area_id);
    text_area.setAttribute("class", text_area_id);


    text_area.style.width = "100%";
    text_area.style.height = "100%"
    text_area.style.resize = "None";
    text_area.style.position = "absolute";
    //text_area.style.opacity = "0%";
    text_area.style.top = "0";
    text_area.style.left = "0";

    text_area.style.zIndex = "2";


    code_cell.appendChild(input_area);
    code_cell.appendChild(text_area);


    let cells = document.getElementById("cells")
    cells.appendChild(code_cell)
    MakeResizeableFromBottomBoundary(code_cell)

}

function handleCodeCellInput(e) {
    let newHeight = Math.max(this.scrollHeight, this.getBoundingClientRect().height);

    this.style.height = newHeight + "px";
    this.parentNode.style.height = newHeight + "px";
    console.log(this);

    let textarea = this.getElementsByTagName("textarea")[0];

    textarea.style.height = newHeight + "px";
    this.parentNode.style.height = newHeight + "px";


    const t = e.target;

    if (e.inputType==="deleteContentBackward") { // for backspace 
      console.log(t.value[t.selectionStart - 1]);
      if ((t.value[t.selectionStart - 1]) === "\n") {

        this.style.height = newHeight - 14 + "px";
        this.parentNode.style.height = newHeight - 14 + "px";
      }
    }
    
}

function sendOnShiftEnter(event) {
    if (event.shiftKey && event.key === 'Enter') {
        this.blur()
       socket.send(this.value)
      }
}

function fourSpacesOnTab(event) {
    console.log(event.key);
    if (event.key === 'Tab') {
       event.preventDefault();
       console.log(event);
       let caret_index = getCaretCharOffset(this);
       let out = insertTabAtIndex(this.innerText, caret_index); 
        console.log(out);
        this.innerHTML = out;
        this.focus();
        }
}

function convertToEditableContentDiv(text) {



}

function insertTabAtIndex(text, index) {
    let out = "";
    for (let i = 0; i < text.length; i++) {
        let ch = text.charAt(i);
        if (i == index) {
            out += " ".repeat(4);
        } else if (ch == "\n") {
            out += "\\n" ;
        } else {
            out += ch;
        }
    }
    return out;
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


function MakeResizeableFromBottomBoundary(code_cell) {

    var drag = false;
    code_cell.addEventListener("mousedown", function (e) {
        console.log("mousedown;")
        drag = true;
    });

    code_cell.addEventListener("mousemove", function (e) {
    
    if (drag) {
        let bounds = this.getBoundingClientRect();        
        let input_area = this.getElementsByTagName("div")[0];
        let text_area = this.getElementsByTagName("textarea")[0];

        console.log(input_area, input_area.scrollHeight, text_area.scrollHeight);
        
        //code_cell
        let newHeight = Math.max(bounds.height + e.movementY, text_area.scrollHeight); //TODO: shadow textinput to get height
        input_area.style.height = newHeight;
        code_cell.style.height = newHeight;
    }
    });

    document.body.addEventListener("mouseup", function (e) {
        console.log("mouseup")
            drag=false;
            });

}


export {AddCodeCell};
