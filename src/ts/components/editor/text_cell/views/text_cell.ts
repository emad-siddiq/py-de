import {InputArea} from "./child_views/input_area.js";

// Class to represent the text cells inside the code editor
// A text cell can be added using the keyboard shortcut ⌘ + shift + 
// Or by clicking the top menu icon


// It uses a custom input area 



class TextCell {
    socket: WebSocket;
    id: string;
    name: string;
    input_area_id: string;
    div: HTMLElement;

    constructor(id) 
    {
        // class name, css id
        this.name = "text-cell";
        this.id = "text-cell-"+id.toString();
        this.input_area_id = this.id + "-input-area";

        this.div = this.createTextCellDiv();
        this.addEventListeners(this.div);
    }

    getDiv() 
    {  
        return this.div;
    }

    addEventListeners(div) {
       div.addEventListener("keydown", this.saveOnShiftEnter.bind(this));
    }

    createTextCellDiv() {
        let text_cell = document.createElement("div");
        text_cell.setAttribute("id", this.id);
        text_cell.setAttribute("class", this.id);
        text_cell.style.left = "0%";
        text_cell.style.top = "0%";

        text_cell.style.width = "100%";
        text_cell.style.height = "70px";
        text_cell.style.overflow = "visible";
        text_cell.style.boxSizing = "border-box";
        text_cell.style.position = "relative";
        text_cell.style.backgroundColor = "red";

        //code_cell.style.border = "solid 4px";
        let input_area = new InputArea(this.input_area_id);
        text_cell.appendChild(input_area.getDiv());


        return text_cell;
    }

    saveOnShiftEnter(e: KeyboardEvent) {
        if (e.shiftKey && e.key === 'Enter') {
            this.socket.send(this.div.textContent);
            return;
        }
    }


   
}




  

export {TextCell};