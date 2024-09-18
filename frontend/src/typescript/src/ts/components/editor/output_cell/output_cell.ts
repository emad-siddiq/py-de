import { DOM } from "./../../../utility/dom";
import { DarkMode } from './../../../themes/darkmode/darkmode';

class OutputCell {
    id: string;
    name: string;
    input_area_id: string;
    div: HTMLElement;
    code_cell_id: string;

    constructor(code_cell_id: string, content: string, type: 'text' | 'matplotlib') 
    {
        this.name = "output-cell";
        this.code_cell_id = code_cell_id;
        this.id = code_cell_id + "-output-cell";
        this.input_area_id = code_cell_id + "-input-area";

        this.div = this.createOutputCellDiv();
        if (type === 'text') {
            this.renderText(content);
        } else {
            this.renderMatplotlibFigure(content);
        }
        this.addOutputCell();
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
        
        output_cell.style.width = "100%";
        output_cell.style.minHeight = "20px";
        output_cell.style.height = "auto";
        output_cell.style.boxSizing = "border-box";
        output_cell.style.marginLeft = "1vw";
        output_cell.style.padding = "10px 5px"; // Added top and bottom padding
        output_cell.style.marginTop = "10px";
        output_cell.style.marginBottom = "10px"; // Added bottom margin for separation
        output_cell.style.position = "relative";
        output_cell.style.fontSize = "14px";
        output_cell.style.fontFamily = "monospace";
        output_cell.style.lineHeight = "1.21428571";
        output_cell.style.overflowX = 'auto';
        output_cell.style.overflowY = 'hidden';
        output_cell.style.borderRadius = '2px';
        output_cell.style.border = 'none';

        this.applyThemeStyles(output_cell);

        return output_cell;
    }

    private applyThemeStyles(element: HTMLElement) {
        if (DarkMode.enabled) {
            element.style.backgroundColor = "#111111";
            element.style.color = "#ffffff";
            element.style.boxShadow = "0px 2px 10px rgba(20, 255, 60, 0.2)";
        } else {
            element.style.backgroundColor = "#f8f8f8";
            element.style.color = "#000000";
            element.style.boxShadow = "0px 2px 10px rgba(0, 0, 0, 0.1)";
        }
    }

    renderText(content: string) {
        const maxHeight = 300;
    
        const contentWrapper = document.createElement('div');
        contentWrapper.style.padding = "5px 0"; // Added vertical padding to content wrapper
    
        content.split('\n').forEach(line => {
            const lineDiv = document.createElement('div');
            lineDiv.textContent = line;
            lineDiv.style.whiteSpace = "pre-wrap";
            lineDiv.style.wordBreak = "break-word";
            lineDiv.style.padding = "0 5px";
            contentWrapper.appendChild(lineDiv);
        });

        this.div.appendChild(contentWrapper);
        this.adjustHeight(maxHeight);
    }

    renderMatplotlibFigure(base64Image: string) {
        const img = document.createElement('img');
        img.src = `data:image/png;base64,${base64Image}`;
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.display = 'block';
        img.style.margin = '10px auto';
        this.div.appendChild(img);

        this.adjustHeight(600); // Increased max height for figures
    }

    adjustHeight(maxHeight: number) {
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

    addOutputCell() {
        DOM.replaceElseAddAfter(this.div, this.code_cell_id);
    }
}

export { OutputCell };