import { marked } from 'marked';
import { ObjectManager } from './../../../../managers/object_manager';
import { DarkMode } from './../../../../themes/darkmode/darkmode';

class TextInput {
    private textarea: HTMLTextAreaElement;

    constructor(private parentElement: HTMLElement, private cellId: number) {
        this.textarea = document.createElement('textarea');
        this.textarea.style.width = '100%';
        this.textarea.style.border = 'none';
        this.textarea.style.outline = 'none';
        this.textarea.style.resize = 'none';
        this.textarea.style.overflow = 'hidden';
        this.textarea.style.backgroundColor = 'transparent';
        this.textarea.style.color = 'inherit';
        this.textarea.style.fontFamily = 'inherit';
        this.textarea.style.fontSize = 'inherit';
        this.textarea.style.lineHeight = '1.5';
        this.textarea.placeholder = 'Enter your text here...';

        this.parentElement.appendChild(this.textarea);

        this.addEventListeners();
    }

    private addEventListeners(): void {
        this.textarea.addEventListener('input', this.autoResize.bind(this));
        this.textarea.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    private autoResize(): void {
        this.textarea.style.height = 'auto';
        this.textarea.style.height = this.textarea.scrollHeight + 'px';
        this.updateCellHeight();
    }

    private updateCellHeight(): void {
        const cell = ObjectManager.getInstance().getObject(`text-cell-${this.cellId}`) as TextCell;
        if (cell) {
            cell.updateHeight(this.textarea.scrollHeight);
        }
    }

    private handleKeyDown(e: KeyboardEvent): void {
        if (e.key === 'Enter' || e.key === 'Backspace' || e.key === 'Delete') {
            setTimeout(() => this.autoResize(), 0);
        }
    }

    public getValue(): string {
        return this.textarea.value;
    }

    public setValue(value: string): void {
        this.textarea.value = value;
        this.autoResize();
    }

    public focus(): void {
        this.textarea.focus();
    }

    public initializeTextArea(): void {
        this.autoResize();
    }
}

export class TextCell {
    private socket: WebSocket | null;
    instance_id: string;
    text_cell_id: number;
    input_area_id: string;
    div: HTMLElement;
    input_area: TextInput;

    constructor(text_cell_id: number) {
        console.log(`Initializing TextCell with id: ${text_cell_id}`);
        this.socket = null;
        this.text_cell_id = text_cell_id;
        this.instance_id = "text-cell-" + text_cell_id.toString();
        this.input_area_id = this.instance_id + "-input-area";
        
        this.createTextCellDiv();
        this.input_area = new TextInput(this.div, this.text_cell_id);
        
        this.applyInitialStyles();
        this.addEventListeners();

        ObjectManager.getInstance().associate(this.instance_id, this);

        // Initialize the text area after a short delay
        setTimeout(() => {
            this.input_area.initializeTextArea();
        }, 0);
    }

    getDiv() {
        return this.div;
    }

    addEventListeners() {
        this.div.addEventListener("click", this.clickHandler.bind(this));
    }

    createTextCellDiv() {
        this.div = document.createElement("div");
        this.div.setAttribute("id", this.instance_id);
        this.div.setAttribute("class", this.instance_id);

        this.div.style.width = "100%";
        this.div.style.minHeight = "70px";
        this.div.style.height = "auto";
        this.div.style.boxSizing = "border-box";
        this.div.style.marginLeft = "1vw";
        this.div.style.paddingLeft = "5px";
        this.div.style.marginTop = "10px";
        this.div.style.position = "relative";
    }

    applyInitialStyles() {
        if (DarkMode.enabled) {
            this.div.style.backgroundColor = "rgb(10, 15, 22)";
            this.div.style.color = "#FCF5F5";
            this.div.style.boxShadow = "0px 5px 15px 5px rgba(20, 255, 60, 0.2)";
        } else {
            this.div.style.backgroundColor = "white";
            this.div.style.color = "black";
            this.div.style.boxShadow = "0px 2px 15px 0px rgba(0, 0, 0, 0.1)";
        }
    }

    clickHandler() {
        this.div.style.boxShadow = "0px 5px 15px 5px rgba(20, 255, 60, .2)";
        ObjectManager.getInstance().getObject("editor").updateActiveCell("text-cell", this.text_cell_id);
    }

    updateHeight(height: number) {
        console.log(`Updating TextCell ${this.instance_id} height to ${height}px`);
        this.div.style.height = `${height}px`;
        this.div.offsetHeight; // Trigger a layout update
    }

    saveContent(): void {
        const markdownContent = this.input_area.getValue();
        const renderedHTML = this.convertMarkdownToHTML(markdownContent);
        this.div.innerHTML = renderedHTML;
    }

    convertMarkdownToHTML(markdown: string): string {
        const html = marked(markdown);
        return `<div style="padding: 10px; width: 100%; box-sizing: border-box;">${html}</div>`;
    }
}