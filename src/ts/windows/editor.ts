import { CodeCell } from "../components/editor/code_cell/ts/views/code_cell.js";
import { OutputCell } from "../components/editor/output_cell/output_cell.js";
import { TextCell } from "../components/editor/text_cell/views/text_cell.js";
import { ObjectManager } from "../managers/object_manager.js";

class Editor {
    div: HTMLElement;
    cc_id: number;    //total -> ?
    tc_id:number;     //      -> ? TODO: Figure out how the id's are being assigned/
    active_code_cell_id: string;
    id: string;
    socket: WebSocket;
    objectManager: ObjectManager;

    constructor(socket: WebSocket, objectManager: ObjectManager) {
        this.div = this.createEditorDiv();
        this.cc_id = 1;
        this.tc_id = 1;
        this.active_code_cell_id = "";
        this.id = "editor";
        this.socket = socket;
        this.socket.addEventListener('message', this.onMessage.bind(this));

        document.body.appendChild(this.div);
        document.body.addEventListener("keydown", this.CMD_PLUS_addCodeCell.bind(this)); 
        document.body.addEventListener("keydown", this.CMD_MINUS_removeCodeCell.bind(this)); 

        this.objectManager = objectManager;
        this.objectManager.associate(this.id, this);
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
        let code_cell = new CodeCell(this.cc_id, this, this.socket);

        let editorDiv = document.getElementById("editor");
        let selectedCodeCell = document.getElementById(this.active_code_cell_id));

        if (this.active_code_cell_id === "" || selectedCodeCell.nextSibling === null) {
            editorDiv.appendChild(code_cell.getDiv()); 
        } else {
            editorDiv.insertBefore(selectedCodeCell.nextSibling, code_cell.getDiv()); //Get current active code cell and 
            
        }

        code_cell.input_area.addLineAfter(0); // add first line TODO: Check this logic and fix it
        this.active_code_cell_id = code_cell.id;

        this.cc_id += 1;
    }

    removeCodeCell() {
        let to_remove = document.getElementById("editor").children[document.getElementById("editor").children.length-1];

        document.getElementById("editor").removeChild(to_remove);
    }


    addTextCell() {
        let text_cell = new TextCell(this.tc_id);

        document.getElementById("editor").appendChild(text_cell.getDiv()); // TODO: Fix this to add cell after the code cell currently being operatsad on 
        this.tc_id += 1;
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

    private onMessage(event: MessageEvent): void {

        // Check this to see if valid python output

        console.log('Python executed output:\n', event.data);
        if (event.data) {
            this.displayMessage(event.data);

        }
    }
    
    private displayMessage(message: string, type: 'normal' | 'error' = 'normal'): void {

        let output_cell = new OutputCell(this.active_code_cell_id, message);

        let code_cell = document.getElementById(this.active_code_cell_id);
        
        if (code_cell.nextSibling === null) {
            this.div.appendChild(output_cell.getDiv()); 
        } else {
            this.div.insertBefore(code_cell.nextSibling, output_cell.getDiv());
            
        }
        // const messageElement = document.createElement('p');
        // messageElement.textContent = message;
        // if (type === 'error') {
        //     messageElement.style.color = 'red';
        // }
       // this.messageContainer.appendChild(messageElement);
       // this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
    }

   




}

export {Editor};