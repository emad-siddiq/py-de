import { marked } from 'marked';

class TextCell {
    socket: WebSocket;
    id: string;
    name: string;
    input_area_id: string;
    div: HTMLElement;
    textareaElement: HTMLTextAreaElement;

    constructor(id: number) {
        this.name = "text-cell";
        this.id = "text-cell-" + id.toString();
        this.input_area_id = this.id + "-input-area";

        this.div = this.createTextCellDiv();
        this.addEventListeners(this.div);
    }

    getDiv(): HTMLElement {
        return this.div;
    }

    addEventListeners(div: HTMLElement): void {
        div.addEventListener("keydown", this.saveOnShiftEnter.bind(this));
    }

    createTextCellDiv(): HTMLElement {
        let text_cell = document.createElement("div");
        text_cell.setAttribute("id", this.id);
        text_cell.setAttribute("class", this.id);
        text_cell.style.left = "2.5%";
        text_cell.style.top = "0%";
        text_cell.style.width = "95.2%";
        text_cell.style.height = "60px";
        text_cell.style.boxSizing = "border-box";
        text_cell.style.position = "relative";
        text_cell.style.boxShadow = "0px 5px 15px 5px rgba(20, 255, 60, 0.2)";


        this.textareaElement = document.createElement('textarea');
        this.textareaElement.style.width = '100%';
        this.textareaElement.style.height = '100%';
        this.textareaElement.style.boxSizing = 'border-box';
        this.textareaElement.style.textIndent = '0.5%';
        this.textareaElement.style.resize = 'none';
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
        return `<div style="background-color: #F0F0F0; padding: 10px; border-radius: 5px;">${html}</div>`;
    }
}

export { TextCell };
