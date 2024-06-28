
var code_cell_id = 1;


function AddCodeCell() {
    let code_cell = document.createElement("div")
    code_cell.setAttribute("id", "code-cell")
    code_cell.setAttribute("class", "code-cell")
    code_cell.style.width = "100%";
    code_cell.style.height = "35px";
    code_cell.style.boxSizing = "border-box";


    code_cell_id += 1; 

    let text_area = document.createElement("textarea")
    text_area.setAttribute("type", "text")
    text_area.addEventListener("input", handleCodeCellInput)
    text_area.addEventListener("keydown", sendOnShiftEnter)
    text_area.addEventListener("keydown", FourSpacesOnTab)

    text_area.style.width = "100%";
    text_area.style.height = "100%"
    text_area.style.resize = "None";
    text_area.style.backgroundColor = "white";

    code_cell.appendChild(text_area)

    let cells = document.getElementById("cells")
    cells.appendChild(code_cell)
    MakeResizeableFromBottomBoundary(code_cell)

}

function handleCodeCellInput(e) {
    let newHeight = Math.max(this.scrollHeight, this.getBoundingClientRect().height)

    this.style.height = newHeight + "px";
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

function FourSpacesOnTab(event) {
    if (event.key === 'Tab') {
       event.preventDefault();
       console.log(this.value);
       this.value = this.value + "    ";
       this.focus();
      }
}


function MakeResizeableFromBottomBoundary(node) {


    var drag = false;
    node.addEventListener("mousedown", function (e) {

        console.log("mousedown;")
        drag = true;
    });

    node.addEventListener("mousemove", function (e) {
    
    if (drag) {
        let bounds = this.getBoundingClientRect();        
        let textarea = this.getElementsByTagName("textarea")[0];
        this.style.height = Math.max(bounds.height + e.movementY, textarea.scrollHeight);
        textarea.style.height = bounds.height + e.movementY;
    }
    });

    document.body.addEventListener("mouseup", function (e) {
        console.log("mouseup")
            drag=false;
            });

}

export {AddCodeCell};
