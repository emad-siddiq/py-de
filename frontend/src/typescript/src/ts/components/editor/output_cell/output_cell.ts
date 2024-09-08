import { DOM } from "./../../../utility/dom";

// Class to represent the output from execution in the corresponding code cell
// Or by clicking the top menu icon

// It is added to the DOM right below the code cell 
// and receives data to show

class OutputCell {
    id: string;
    name: string;
    input_area_id: string;
    div: HTMLElement;
    code_cell_id: string;

    constructor(code_cell_id: string, content: string) 
    {
        this.name = "output-cell";
        this.code_cell_id = code_cell_id;
        this.id = code_cell_id + "-output-cell";
        this.input_area_id = code_cell_id + "-input-area";

        this.div = this.createOutputCellDiv();
        this.renderText(content);
        DOM.appendAfter(this.div, this.code_cell_id)

    }

    getDiv() 
    {  
        return this.div;
    }

    static isOutputCellId(id: string) {
        return id.toLowerCase().endsWith("-output-cell");
    }

    createOutputCellDiv() {
        let output_cell = document.createElement("div");
        output_cell.setAttribute("id", this.id);
        output_cell.setAttribute("class", this.name);
        
        
        
        // Add margin to the top
        output_cell.style.paddingTop = "10px"; // You can adjust this value as needed
        
        // Maintain existing styles
        output_cell.style.width = "100%";
        output_cell.style.boxSizing = "border-box";
        output_cell.style.fontSize = "13px";
        output_cell.style.backgroundColor = "#eeeeee";
        output_cell.style.textIndent = "0.8vw";
        output_cell.style.fontFamily = "Consolas,Monaco,Lucida Console,Liberation Mono,DejaVu Sans Mono,Bitstream Vera Sans Mono,Courier New";
        //output_cell.style.paddingTop = "1.2vh";
        //output_cell.style.paddingBottom = "1.2vh";
        output_cell.style.boxShadow = "0px 2px 15px 0px rgba(0, 0, 0, .1)";
        output_cell.style.overflowY = 'auto';

        return output_cell;
    }

    renderText(content: string) {
        const maxHeight = 300;
    
        content.split('\n').forEach(line => {
            const lineDiv = document.createElement('div');
            lineDiv.textContent = line;
            this.div.appendChild(lineDiv);
        });

        requestAnimationFrame(() => {
            const contentHeight = this.div.scrollHeight;
            if (contentHeight > maxHeight) {
                this.div.style.height = `${maxHeight}px`;
                this.div.style.overflowY = 'auto';
            } else {
                this.div.style.height = `${contentHeight}px`;
            }
        });
    }



    
}

export { OutputCell };