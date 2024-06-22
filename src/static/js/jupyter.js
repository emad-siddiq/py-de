
var button = document.getElementById("add_cell");
button.addEventListener("click", function(event){
    AddCodeCell()
 });

var code_cell_id = 1;
var socket;
connectToWS().then(server => {socket = server});

AddCodeCell()

function AddCodeCell() {
    let code_cell = document.createElement("div")
    code_cell.setAttribute("id", "code-cell")
    code_cell.setAttribute("class", "code-cell")
    code_cell.style.flex = code_cell_id;
    code_cell_id += 1; 

    let text_area = document.createElement("textarea")
    text_area.setAttribute("type", "text")
    text_area.addEventListener("input", handleCodeCellInput)
    code_cell.appendChild(text_area)
 


    let cells = document.getElementById("cells")
    cells.appendChild(code_cell)
}


function handleCodeCellInput(event) {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + "px";
    console.log(this.value)
    socket.send(this.value)
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
        var server = new WebSocket('ws://localhost:8080/v4/ws');
        server.onopen = function() {
            resolve(server);
        };
        server.onerror = function(err) {
            reject(err);
        };

    });
}



