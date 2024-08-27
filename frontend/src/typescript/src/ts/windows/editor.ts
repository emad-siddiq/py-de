import { CodeCell } from "../components/editor/code_cell/ts/views/code_cell";
import { OutputCell } from "../components/editor/output_cell/output_cell";
import { TextCell } from "../components/editor/text_cell/views/text_cell";
import { ObjectManager } from "../managers/object_manager";
import { removeElement } from "../utility/dom";

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

    
    createFileNameDiv(): HTMLDivElement {
        let fileName: string = "Untitled";
        let fileNameDiv: HTMLDivElement = document.createElement("div");
        fileNameDiv.setAttribute("id", "filename");
        fileNameDiv.setAttribute("class", "filename");
    
        // Initial setup for the div
        fileNameDiv.innerHTML = fileName;
        fileNameDiv.style.fontSize = "24px";
        fileNameDiv.style.width = "150px"; // Set a smaller initial width
        fileNameDiv.style.display = "inline-block"; // Allows width and height to fit content
        fileNameDiv.style.fontFamily = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";
        fileNameDiv.style.marginBottom = "10px";
        fileNameDiv.style.paddingTop = "10px";
        fileNameDiv.style.paddingLeft = "10px";
        fileNameDiv.style.boxSizing = "border-box"; // Include padding in width and height
    
        // Function to switch from div to input for editing
        function enableEditing(): void {
            const input: HTMLInputElement = document.createElement("input");
            input.type = "text";
            input.value = fileName;
            input.style.fontSize = "24px";
            input.style.width = "auto"; // Allow width to grow based on content
            input.style.minWidth = "150px"; // Ensure a minimum width for initial view
            input.style.display = "inline-block"; // Adjust width to fit content
            input.style.fontFamily = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";
            input.style.marginBottom = "10px";
            input.style.paddingTop = "10px";
            input.style.paddingLeft = "10px";
            input.style.boxSizing = "border-box";
    
            // Replace the div with the input element
            fileNameDiv.replaceWith(input);
            input.focus();
    
            // Temporary span for measuring text width
            const measureSpan: HTMLSpanElement = document.createElement("span");
            measureSpan.style.position = "absolute";
            measureSpan.style.visibility = "hidden";
            measureSpan.style.whiteSpace = "pre";
            measureSpan.style.fontSize = "24px";
            measureSpan.style.fontFamily = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";
            document.body.appendChild(measureSpan);
    
            // Function to update the width of the div
            function updateDivSize(): void {
                measureSpan.textContent = input.value || "Untitled"; // Default to "Untitled" if input is empty
                const newWidth = measureSpan.offsetWidth + 20; // Add some padding
                fileNameDiv.style.width = `${newWidth}px`; // Adjust width to fit the measured width
                input.style.width = `${newWidth}px`; // Sync input width with div width
            }
    
            // Update size initially
            updateDivSize();
    
            // Event listener to handle the input's blur (when it loses focus)
            input.addEventListener("blur", () => {
                fileName = input.value;
                fileNameDiv.innerHTML = fileName;
                fileNameDiv.style.width = 'auto'; // Reset width to fit content
                input.replaceWith(fileNameDiv);
                document.body.removeChild(measureSpan); // Clean up
            });
    
            // Handle Enter key to confirm the edit
            input.addEventListener("keydown", (event: KeyboardEvent) => {
                if (event.key === "Enter") {
                    input.blur(); // Trigger the blur event to save the text
                }
            });
    
            // Update width as user types
            input.addEventListener("input", updateDivSize);
        }
    
        // Double-click event to enable editing
        fileNameDiv.addEventListener("dblclick", enableEditing);
    
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

        let selectedCodeCell = document.getElementById(this.active_code_cell_id);

  

        if (this.active_code_cell_id === "" || (selectedCodeCell && selectedCodeCell.nextSibling === null))  {
            editorDiv.appendChild(code_cell.getDiv()); 
        } else {
            console.log( selectedCodeCell,selectedCodeCell.nextSibling )

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
            console.log(code_cell.nextElementSibling);
            if (code_cell.nextElementSibling.getAttribute("id") === code_cell.id + "-output-cell") {
                code_cell.nextElementSibling.replaceWith(output_cell.getDiv());
            } else {
                this.div.insertBefore(code_cell.nextSibling, output_cell.getDiv());

            }
          
            
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