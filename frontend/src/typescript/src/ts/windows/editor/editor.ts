import { CodeCell } from "../../components/editor/code_cell/ts/views/code_cell";
import { OutputCell } from "../../components/editor/output_cell/output_cell";
import { TextCell } from "../../components/editor/text_cell/views/text_cell";
import { ObjectManager } from "../../managers/object_manager";
import { FileName } from "./filename";

// The editor class represents the combination of code cells, text cells, output cells
// and any other kind of cells that might be required to enhance a Python coder's experience

export class Editor {
    div: HTMLElement;  // The HTML div to append to document.body
    // Cell Id: These are assigned linearly and don't change
    cc_id: number;     // The code cell id
    tc_id: number;     // The text cell id. 
    // 
    active_code_cell_id: string;
    id: string;        // The name to call this class: editor
    objectManager: ObjectManager; // The objectManager shared between all our classes
    fileName: FileName;           // The FileName to assign this notebook. TODO: Add a feature that saves the notebook to file

    constructor(objectManager: ObjectManager) {
        this.id = "editor";                      
        this.fileName = new FileName();          // Defaults to Untitled
        this.div = this.createEditorDiv();       // absolute positioned div
        this.cc_id = 1;                          // first code cell id [1]
        this.tc_id = 1;                          // - no UI rep, keeps tracks of text cells on backend
        this.active_code_cell_id = "";           // TODO: Check what purpose this serves
        this.objectManager = objectManager;      // Passed down in jupyter.ts

        this.objectManager.associate(this.id, this); // Save a copy in our Object Manager
        //Append as child to document.body and activate event listeners
        document.body.appendChild(this.div);
        CodeCell.addCodeCell(this.cc_id, this.active_code_cell_id);

        this.addEventListeners();

    }

    addEventListeners() {
        // Add Code Cell on CMD + Shift + '+'
        document.body.addEventListener("keydown", this.CMD_PLUS_addCodeCell.bind(this)); 
         // Remove Code Cell on CMD + Shift + '-'
        document.body.addEventListener("keydown", this.CMD_MINUS_removeCodeCell.bind(this));
    }

    private createEditorDiv() {
        // Creates an editor div that takes up the entire visible screen.
        // Inserts the FileName div which by virtue of being the first child gets the top left pos:
        // TODO: Fix this to make object placement on the screen always use absolute placement.

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
            CodeCell.addCodeCell(this.cc_id, this.active_code_cell_id);
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

    
}