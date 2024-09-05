import { CodeCell } from "../../components/editor/code_cell/ts/views/code_cell";
import { OutputCell } from "../../components/editor/output_cell/output_cell";
import { TextCell } from "../../components/editor/text_cell/views/text_cell";
import { ObjectManager } from "../../managers/object_manager";
import { InputAreaEditor } from "../../components/editor/code_cell/ts/controllers/input_area_controller";
import { FileName } from "./filename";

export class Editor {
    div: HTMLElement;
    cc_id: number;
    tc_id: number;
    active_code_cell_id: string;
    id: string;
    objectManager: ObjectManager;
    fileName: FileName;

    constructor(socket: WebSocket, objectManager: ObjectManager) {
        this.fileName = new FileName();
        this.div = this.createEditorDiv();
        this.cc_id = 1;
        this.tc_id = 1;
        this.active_code_cell_id = "";
        this.id = "editor";
        this.objectManager = objectManager;

        document.body.appendChild(this.div);
        document.body.addEventListener("keydown", this.CMD_PLUS_addCodeCell.bind(this)); 
        document.body.addEventListener("keydown", this.CMD_MINUS_removeCodeCell.bind(this)); 

        this.objectManager.associate(this.id, this);
    }

    private createEditorDiv() {
        let div = document.createElement("div");
        div.setAttribute("id", "editor");
        div.setAttribute("class", "editor");
    
        div.style.position = "absolute";
        div.style.top = "0%";
        div.style.left = "0%";
        div.style.backgroundColor = "white";
        div.style.width = "100%";
        div.style.height = "100%";
        div.style.boxSizing = "border-box";

        div.appendChild(this.fileName.getDiv());

        return div;
    }

    public addCodeCell() {
        console.log(`Adding new code cell. Current cc_id: ${this.cc_id}`);
        let code_cell = new CodeCell(this.cc_id, this);
        code_cell.getDiv().classList.add('code-cell'); // Add 'code-cell' class

        let editorDiv = document.getElementById("editor");

        let selectedCodeCell = document.getElementById(this.active_code_cell_id);

        if (this.active_code_cell_id === "" || (selectedCodeCell && selectedCodeCell.nextSibling === null))  {
            console.log(`Appending new code cell to editor`);
            editorDiv.appendChild(code_cell.getDiv()); 
        } else {
            console.log(`Inserting new code cell after ${this.active_code_cell_id}`);
            editorDiv.insertBefore(code_cell.getDiv(), selectedCodeCell.nextSibling);
        }

        console.log(`Adding first line to code cell ${this.cc_id}`);
        code_cell.input_area.addLineAfter(0); // add first line
        console.log(`First line added to code cell ${this.cc_id}`);
        
        this.active_code_cell_id = code_cell.id;

        this.cc_id += 1;
        console.log(`Code cell added. New cc_id: ${this.cc_id}`);
    }

    public removeCodeCell() {
        let to_remove = document.getElementById("editor").children[document.getElementById("editor").children.length-1];
        document.getElementById("editor").removeChild(to_remove);
    }

    public addTextCell() {
        let text_cell = new TextCell(this.tc_id);
        document.getElementById("editor").appendChild(text_cell.getDiv());
        this.tc_id += 1;
    }

    private CMD_PLUS_addCodeCell(e: KeyboardEvent) {
        let ctrl_cmd = e.metaKey || e.ctrlKey;
        if (ctrl_cmd && e.shiftKey && e.key === "=") {
            e.stopPropagation();
            e.preventDefault();
            this.addCodeCell();
        }
    }

    private CMD_MINUS_removeCodeCell(e: KeyboardEvent) {
        let ctrl_cmd = e.metaKey || e.ctrlKey;
        if (ctrl_cmd && e.shiftKey && e.key === "-") {
            e.stopPropagation();
            e.preventDefault();
            this.removeCodeCell();
        }
    }

    public displayOutputCell(message: string, type: 'normal' | 'error' = 'normal'): void {
        console.log(`Displaying message: ${message}, type: ${type}`);
        
        try {
            const output_cell = new OutputCell(this.active_code_cell_id, message);
            const code_cell = document.getElementById(this.active_code_cell_id);
    
            if (!code_cell) {
                console.error(`Code cell with id ${this.active_code_cell_id} not found`);
                return;
            }
    
            const output_cell_div = output_cell.getDiv();
    
            if (!code_cell.nextSibling) {
                console.log('No next sibling, appending output cell to this.div');
                this.div.appendChild(output_cell_div);
            } else {
                const next_element = code_cell.nextElementSibling;
                console.log('Next element:', next_element);
    
                if (next_element && next_element.id === `${code_cell.id}-output-cell`) {
                    console.log('Replacing existing output cell');
                    next_element.replaceWith(output_cell_div);
                } else {
                    console.log('Inserting output cell after code cell');
                    code_cell.after(output_cell_div);
                }
            }
    
            if (type === 'error') {
                output_cell_div.style.color = 'red';
            }
    
            output_cell_div.scrollIntoView({ behavior: 'smooth', block: 'end' });
    
        } catch (error) {
            console.error('Error in displayOutputCell:', error);
        }
    }
}