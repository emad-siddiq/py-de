import { CodeCell } from "./code_cell.js";

var id = 1;

function AddCodeCell(socket) {
    //Assign counter to current code cell and increment counter.

    let cells = document.getElementById("cells")
    let code_cell = new CodeCell(id, socket);
    cells.appendChild(code_cell.getDiv());
    id += 1;

}

export {AddCodeCell};
