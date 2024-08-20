import { CodeCell } from "../components/editor/code_cell/ts/views/code_cell.js";


class Editor {
    div: HTMLElement;
    cc_id: number;
    id: string;
    socket: WebSocket;

    constructor(socket: WebSocket) {
        this.div = this.createEditorDiv();
        this.cc_id = 1;
        this.id = "editor";
        this.socket = socket;
        document.body.appendChild(this.div);
        document.body.addEventListener("keydown", this.CMD_PLUS_addCodeCell.bind(this)); 
        document.body.addEventListener("keydown", this.CMD_MINUS_removeCodeCell.bind(this)); 
    }

    getDiv() {
        return this.div;
    }

    createEditorDiv() {
        let div = document.createElement("div");
        div.setAttribute("id", "editor");
        div.setAttribute("class", "editor");
    
        div.style.position = "absolute";

        div.style.top = "0%";
        div.style.left = "0%";
        div.style.backgroundColor = "white";
        div.style.width = "100%";
        div.style.height = "100%";
        div.style.boxSizing = "border-box"; // https://developer.mozilla.org/en-US/docs/Web/CSS/box-sizing

        let fileNameDiv = this.createFileNameDiv();
        div.appendChild(fileNameDiv);

        return div;
    }

    createFileNameDiv() {
        let file_name = "Untitled";
        let fileNameDiv = document.createElement("div");
        fileNameDiv.setAttribute("id", "filename");
        fileNameDiv.setAttribute("class", "filename");

        fileNameDiv.innerHTML = file_name;
        fileNameDiv.style.fontSize = "24px";
        fileNameDiv.style.width = "95%";

        fileNameDiv.style.fontFamily = "ui-monospace,SFMono-Regular,\"SF Mono\",Menlo,Consolas,\"Liberation Mono\",monospace";
        fileNameDiv.style.marginBottom = "10px";
        fileNameDiv.style.paddingTop   = "10px";
        fileNameDiv.style.paddingLeft = "10px";
        return fileNameDiv;
    }


    toggleBinding(e) {
        let ctrl_cmd = e.metaKey || e.ctrlKey;          // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent
        if (ctrl_cmd && e.key === 'd') {
            e.preventDefault();
            e.stopPropagation();
            this.toggle();
            return;
        }
    }

    toggle() {
        if (document.getElementById("debugger")) {
            document.body.removeChild(this.div)
        } else {
            document.body.appendChild(this.div);
        }
     
    }



 
    addCodeCell() {
        let code_cell = new CodeCell(this.cc_id, this.socket);

        document.getElementById("editor").appendChild(code_cell.getDiv());
        code_cell.input_area.addLineAfter(0); // add first line TODO: Check this logic and fix it

        this.cc_id += 1;
    }

    removeCodeCell() {
        let to_remove = document.getElementById("editor").children[document.getElementById("editor").children.length-1];

        document.getElementById("editor").removeChild(to_remove);
    }

    CMD_PLUS_addCodeCell(e) {
        let ctrl_cmd = e.metaKey || e.ctrlKey;
        if (ctrl_cmd && e.shiftKey && e.key === "=") {
            e.stopPropagation();
            e.preventDefault();
            this.addCodeCell();
        }
    }


    CMD_MINUS_removeCodeCell(e) {
        let ctrl_cmd = e.metaKey || e.ctrlKey;
        if (ctrl_cmd && e.shiftKey && e.key === "-") {
            e.stopPropagation();
            e.preventDefault();
            this.removeCodeCell();
        }
    }



}

export {Editor};