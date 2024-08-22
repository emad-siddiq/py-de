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
        text_cell.style.left = "2.5%";
        text_cell.style.top = "0%";

        text_cell.style.width = "98.2%";
        text_cell.style.height = "60px";
        //text_cell.style.overflow = "visible";
        text_cell.style.boxSizing = "border-box";
        text_cell.style.position = "relative";
        text_cell.style.backgroundColor = "red";



        //code_cell.style.border = "solid 4px";
        const textareaElement = document.createElement('textarea');
    
        // Optionally, set properties on the textarea
  // Set the textarea to take up all the space in the parent div
  textareaElement.style.width = '100%';
  textareaElement.style.height = '100%';
  textareaElement.style.boxSizing = 'border-box'; // Ensures padding and border are included in width/height
  textareaElement.style.textIndent = '0.5%'; // Ensures padding and border are included in width/height
  textareaElement.style.resize = 'none'; // Ensures padding and border are included in width/height
  textareaElement.style.overflowY = 'hidden'; // Hide the vertical scrollbar


        textareaElement.placeholder = 'Enter your text here...';

        const autoResize = () => {
            textareaElement.style.height = 'auto'; // Reset height to auto before calculating
            textareaElement.style.height = Math.max(60, textareaElement.scrollHeight) + 'px'; // Set the height to the scrollHeight
            text_cell.style.height = textareaElement.style.height;
        };
    
        // Adjust the textarea size whenever the user types
        textareaElement.addEventListener('input', autoResize);
    
        // Optionally, call autoResize initially if the textarea has pre-filled content
        //autoResize();
        
        text_cell.appendChild(textareaElement);


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