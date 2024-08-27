import { ObjectManager } from "../../../managers/object_manager.js";

// Class to represent the output from execution in the corresponding code cell
// Or by clicking the top menu icon

// It is added to the DOM right below the code cell 
// and receives data to show


class OutputCell {
    id: string;
    name: string;
    input_area_id: string;
    div: HTMLElement;
    objectManager: ObjectManager;

    constructor(code_cell_id: string, content: string) 
    {
        // class name, css id
        this.name = "output-cell";
        this.id = code_cell_id.toString() + "-output-cell";
        this.input_area_id = this.id + "-input-area";

        this.div = this.createOutputCellDiv();
        this.renderText(content);
    }

    getDiv() 
    {  
        return this.div;
    }

    createOutputCellDiv() {
        let output_cell = document.createElement("div");
        output_cell.setAttribute("id", this.id);
        output_cell.setAttribute("class", this.id);
        output_cell.style.left = "3%";
        output_cell.style.top = "0%";

        output_cell.style.width = "94.5%";
        output_cell.style.height = "60px";
        output_cell.style.overflowY = 'auto';
        output_cell.style.boxSizing = "border-box";
        output_cell.style.position = "relative";
        output_cell.style.fontSize = "13px";
        output_cell.style.backgroundColor = "#eeeeee";
        output_cell.style.textIndent = "0.8vw";
        output_cell.style.fontFamily = "Consolas,Monaco,Lucida Console,Liberation Mono,DejaVu Sans Mono,Bitstream Vera Sans Mono,Courier New";
        output_cell.style.paddingTop = "1.2vh";
        output_cell.style.paddingBottom = "1.2vh";
        output_cell.style.boxShadow = "0px 2px 15px 0px rgba(0, 0, 0, .1)";






        return output_cell;
    }

    renderText(content: string) {
        // Create a div element
        const maxHeight = 300;     // Maximum height before scrolling is enabled
    
        // Split the content by newline characters and iterate over each line
        content.split('\n').forEach(line => {
            // Create a paragraph element for each line
            const lineDiv = document.createElement('div');
            lineDiv.textContent = line;
            
            // Add a line break after each line
            this.div.appendChild(lineDiv);

                // Adjust the height dynamically based on content up to the maximum height
            
            const contentHeight = this.div.scrollHeight;
            if (contentHeight > maxHeight) {
                this.div.style.height = `${maxHeight}px`;
                this.div.style.overflowY = 'auto'; // Enable scrolling if content exceeds max height
            } else {
                this.div.style.height = `${contentHeight}px`; // Set height to content height
            }

        });

        // Use requestAnimationFrame to ensure the content is rendered before calculating height
    requestAnimationFrame(() => {
        const contentHeight = this.div.scrollHeight;
        if (contentHeight > maxHeight) {
            this.div.style.height = `${maxHeight}px`;
            this.div.style.overflowY = 'auto'; // Enable scrolling if content exceeds max height
        } else {
            this.div.style.height = `${contentHeight}px`; // Set height to content height
        }
    });
    }


   
}




  

export {OutputCell};