import { marked } from 'marked';
import { ObjectManager } from './../../../../managers/object_manager';

class TextCell {
    socket: WebSocket;
    text_cell_id: number;
    input_area_id: string;
    instance_id: string;
    div: HTMLElement;
    textareaElement: HTMLTextAreaElement;

    constructor(id: number) {
        this.text_cell_id = id;
        this.instance_id = "text-cell-" + this.text_cell_id.toString();
        this.input_area_id = this.instance_id + "-input-area";

        this.div = this.createTextCellDiv();
        this.addEventListeners(this.div);
    }

    getDiv(): HTMLElement {
        return this.div;
    }

    addEventListeners(div: HTMLElement): void {
        div.addEventListener("keydown", this.saveOnShiftEnter.bind(this));
        div.addEventListener("click", this.clickHandler.bind(this));
    }

    clickHandler() {
        ObjectManager.getInstance().getObject("editor").updateActiveCell("text-cell", this.text_cell_id);
    }

    createTextCellDiv(): HTMLElement {
        let text_cell = document.createElement("div");
        text_cell.setAttribute("id", this.instance_id);
        text_cell.setAttribute("class", this.instance_id);
      
        text_cell.style.width = "100%"; // Changed to 100%
        text_cell.style.minHeight = "60px"; // Changed height to minHeight
        text_cell.style.boxSizing = "border-box";
        text_cell.style.boxShadow = "0px 5px 15px 5px rgba(20, 255, 60, 0.2)";

        this.textareaElement = document.createElement('textarea');
        this.textareaElement.style.width = '100%';
        this.textareaElement.style.minHeight = '60px'; // Changed height to minHeight
        this.textareaElement.style.boxSizing = 'border-box';
        this.textareaElement.style.padding = '10px'; // Added padding instead of text-indent
        this.textareaElement.style.resize = 'none'; // Changed to vertical to allow vertical resizing
        this.textareaElement.style.overflowY = 'hidden';
        this.textareaElement.placeholder = 'Enter your text here...';

        const autoResize = () => {
            this.textareaElement.style.height = 'auto';
            this.textareaElement.style.height = Math.max(60, this.textareaElement.scrollHeight) + 'px';
            text_cell.style.height = this.textareaElement.style.height;
        };
    
        this.textareaElement.addEventListener('input', autoResize);
        text_cell.appendChild(this.textareaElement);

        return text_cell;
    }

    async saveOnShiftEnter(e: KeyboardEvent): Promise<void> {
        if (e.shiftKey && e.key === 'Enter') {
            e.preventDefault(); // Prevent the default newline behavior
            const markdownContent = this.textareaElement.value;
            const renderedHTML = await this.convertMarkdownToHTML(markdownContent); // Wait for the promise to resolve
            this.div.innerHTML = renderedHTML; // Replace the div content with the rendered HTML
            //this.socket.send(renderedHTML);
        }
    }

    convertMarkdownToHTML(markdown: string): string {
        // Using marked.js to convert markdown to HTML
        const html = marked(markdown);
        return `<div style="background-color: #F0F0F0; padding: 10px; border-radius: 5px; width: 100%; box-sizing: border-box;">${html}</div>`;
    }
}

export { TextCell };