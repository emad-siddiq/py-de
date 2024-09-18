import { DOM } from "./../../utility/dom";
import { CodeCell } from "../../components/editor/code_cell/ts/views/code_cell";
import { TextCell } from "../../components/editor/text_cell/views/text_cell";
import { ObjectManager } from "../../managers/object_manager";
import { FileName } from "./filename";
import { OutputCell } from "./../../components/editor/output_cell/output_cell";

// The editor class represents the combination of code cells, text cells, output cells
// and any other kind of cells that might be required to enhance a Python coder's experience
// This all occures in a 2d editor that takes up the entire screen

export class Editor {

    div: HTMLElement;  // The HTML div to append to document.body
    
    instance_id: string;                   // instance_id
    objectManager: ObjectManager; // The objectManager shared between all our classes
    fileName: FileName;           // The FileName to assign this notebook. TODO: Add a feature that saves the notebook to file
    code_cell_counter: number;         // This is the code cell number found in corresponding div id e.g. code-cell-1 
    text_cell_counter: number;         // This is the text cell number                               e.g. text-cell-1
    run_order: number;            // order a cell is run in
    active_cell_type: string;     // [code_cell, text_cell]
    active_cell_number: number;   // the code_cell_id or text_cell-id e.g code-cell-1 or text-cell-10


    constructor() {  // 

        this.instance_id = "editor";             // We plan on having one editor for now                 
        this.fileName = new FileName();          // Defaults to Untitled
        this.div = this.createEditorDiv();       // absolute positioned div

        // We want the different cell types added in a certain order. 
        
        // The editor space is initialized with just the code cell in the editor. This is Code Cell 1.
        // We mark this as the active_cell

        // Here we can branch three ways:
        //                                  1) Append code cell after the current active text or code cell
        //                               2) Append an output cell to whichever code cell ran some code
        //                               3) Append a text cell after the current active text or code cell

        //                              
        this.active_cell_type = "code_cell";       //  
        this.active_cell_number = 0;               // switches between text and code

        // Code Cell specific
        this.code_cell_counter = 0;                     // corresponds to div
        this.run_order = 1;                        // order code cells are run in, same cell can be run multiple times
        
        // Text Cell specific                        
        this.text_cell_counter = 0;                     // 

        ObjectManager.getInstance().associate(this.instance_id, this); // Save a copy in our Object Manager

        //Append as child to document.body and activate event listeners
        document.body.appendChild(this.div);

        this.addCodeCell();

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
        // Inserts the FileName div which by virtue of being the first child gets the top left pos
        // TODO: Fix this to make object placement on the screen always use absolute placement.

        let div = document.createElement("div");
        div.setAttribute("id", "editor");
        div.setAttribute("class", "editor");
    
        div.style.position = "absolute";
        div.style.top = "0%";
        div.style.left = "0%";
        div.style.backgroundColor = "white";
        div.style.width = "auto";
        div.style.minWidth = "97.75vw";

        div.style.height = "auto";
        div.style.boxSizing = "border-box";
        div.style.display = "flex";
        div.style.flexDirection = "column";

        div.appendChild(this.fileName.getDiv());

        return div;
    }


    public removeCodeCell() {
        let to_remove = document.getElementById("editor").children[document.getElementById("editor").children.length-1];
        document.getElementById("editor").removeChild(to_remove);
    }

    public addTextCell() {
        this.text_cell_counter += 1;
        let text_cell = new TextCell(this.text_cell_counter);

        let insertAfterElementId = this.active_cell_type + "-" + this.active_cell_number.toString();

        // Check if the active cell is a code cell and has an output cell after it
        if (this.active_cell_type === "code-cell") {
            let nextSiblingId = DOM.getNextSiblingId(insertAfterElementId);
            if (nextSiblingId && OutputCell.isOutputCellId(nextSiblingId)) {
                insertAfterElementId = nextSiblingId;
            }
        }

        DOM.addElementAfter("editor", text_cell.getDiv(), insertAfterElementId);
        
        this.updateActiveCell("text-cell", this.text_cell_counter);
    }

    /*

        This should add a code cell after the currently active cell. 
        A currently active cell is one that has been clicked on.
        Clicking on another code cell should switch active code cell.
        Click anywhere besides a code cell should switch active code cell to none.

    */
    public addCodeCell() {
        // Create a new Code Cell
        
        //Increment code_cell_counter counter by one
        this.code_cell_counter += 1
        let code_cell = new CodeCell(this.code_cell_counter);

        if (this.active_cell_type === "text-cell") {
            DOM.addElementAfter("editor", code_cell.getDiv(), "text-cell-" + this.active_cell_number.toString());
        }
    

        // First Code Cell
        if (this.active_cell_number === 0)  {
            DOM.addElementAfter("editor", code_cell.getDiv()); 
        } else {  //Insert it after the id specified
            if (this.active_cell_type == "code-cell") {
                let instance_id = "code-cell-" + this.active_cell_number;
                let nextCellId = DOM.getNextSiblingId(instance_id);
                if (nextCellId !== null && OutputCell.isOutputCellId(nextCellId)) {
                    nextCellId = DOM.getNextSiblingId(nextCellId);
                }
                let editorDiv = document.getElementById("editor");
                editorDiv.insertBefore(code_cell.getDiv(), document.getElementById(nextCellId));
            }
            
        }

        this.updateActiveCell("code-cell", this.code_cell_counter);


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


    updateActiveCell(type: string, counter: number) {
        console.log("Active cell ", type, counter);
        this.active_cell_type = type;
        this.active_cell_number = counter;
    }

    
}