import { MakeResizeableFromBottomBoundary } from "./node/node.js";

var button = document.getElementById("add_cell");
button.addEventListener("click", function(event){
    AddCodeCell()
 });

var code_cell_id = 1;
var socket;

connectToWS().then(server => {
    socket = server;
    AddCodeCell()
    socket.onmessage = (event) => {
        console.log(event.data);
    };

});

window.onbeforeunload = function(event)
{
    socket.close();
    return confirm("Confirm refresh");
};



function AddCodeCell() {
    let code_cell = document.createElement("div")
    code_cell.setAttribute("id", "code-cell")
    code_cell.setAttribute("class", "code-cell")
    code_cell.style.flex = code_cell_id;
    code_cell_id += 1; 

    let text_area = document.createElement("textarea")
    text_area.setAttribute("type", "text")
    text_area.addEventListener("input", handleCodeCellInput)
    text_area.addEventListener("keydown", sendOnShiftEnter)
    code_cell.appendChild(text_area)

    let separator = document.createElement("div")
    separator.setAttribute("id", "separator")
    separator.setAttribute("class", "separator")


    let cells = document.getElementById("cells")
    cells.appendChild(code_cell)
    cells.appendChild(separator)
    MakeResizeableFromBottomBoundary(separator)


}




function handleCodeCellInput(event) {
    this.style.height= "";
    this.style.height = this.scrollHeight + "px";
    this.parentNode.height = this.scrollHeight + "px";
}

function sendOnShiftEnter(event) {
    if (event.shiftKey && event.key === 'Enter') {
        this.blur()
       socket.send(this.value)
      }
}


async function connectToWS() {
    try {
        let server = await connect()
        console.log("connected to socket")
        return server
        // ... use server
    } catch (error) {
        console.log("ooops ", error)
    }
  }


function connect() {
    return new Promise(function(resolve, reject) {
        var server = new WebSocket('ws://localhost:8080/v1/ws');
        server.onopen = function() {
            resolve(server);
        };
        server.onerror = function(err) {
            reject(err);
        };

    });
}



