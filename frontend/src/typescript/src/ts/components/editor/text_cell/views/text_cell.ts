import { marked } from 'marked';
import { ObjectManager } from './../../../../managers/object_manager';
import { DarkMode } from './../../../../themes/darkmode/darkmode';

class TextInput {
    private textarea: HTMLTextAreaElement;
    private onShiftEnter: () => void;

    constructor(private parentElement: HTMLElement, private cellId: number, onShiftEnter: () => void) {
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
        this.textarea.placeholder = 'Enter your markdown here...';

        this.parentElement.appendChild(this.textarea);
        this.onShiftEnter = onShiftEnter;

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
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = this.textarea.selectionStart;
            const end = this.textarea.selectionEnd;
            const value = this.textarea.value;
            this.textarea.value = value.substring(0, start) + '    ' + value.substring(end);
            this.textarea.selectionStart = this.textarea.selectionEnd = start + 4;
            this.autoResize();
        } else if (e.key === 'Enter' && e.shiftKey) {
            e.preventDefault();
            this.onShiftEnter();
        } else if (e.key === 'Enter') {
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
    rendered_content: HTMLElement;

    constructor(text_cell_id: number) {
        console.log(`Initializing TextCell with id: ${text_cell_id}`);
        this.socket = null;
        this.text_cell_id = text_cell_id;
        this.instance_id = "text-cell-" + text_cell_id.toString();
        this.input_area_id = this.instance_id + "-input-area";
        
        this.createTextCellDiv();
        this.input_area = new TextInput(this.div, this.text_cell_id, this.convertAndRender.bind(this));
        
        this.rendered_content = document.createElement('div');
        this.rendered_content.style.display = 'none';
        this.rendered_content.style.paddingBottom = '10px'; // Keep bottom padding
        this.div.appendChild(this.rendered_content);
        
        this.applyInitialStyles();
        this.addEventListeners();

        ObjectManager.getInstance().associate(this.instance_id, this);

        setTimeout(() => {
            this.input_area.initializeTextArea();
        }, 0);
    }

    getDiv() {
        return this.div;
    }

    addEventListeners() {
        this.div.addEventListener("click", this.clickHandler.bind(this));
        this.div.addEventListener("dblclick", this.doubleClickHandler.bind(this));
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
        this.div.style.paddingTop = "10px"; // Add top padding to the main div
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

    doubleClickHandler() {
        this.enterEditMode();
    }

    enterEditMode() {
        const textarea = this.div.querySelector('textarea') as HTMLTextAreaElement;
        textarea.style.display = 'block';
        textarea.style.marginTop = '0'; // Ensure textarea aligns with the top
        this.rendered_content.style.display = 'none';
        textarea.value = this.input_area.getValue();
        textarea.focus();
    }

    updateHeight(height: number) {
        console.log(`Updating TextCell ${this.instance_id} height to ${height}px`);
        this.div.style.height = `${height + 20}px`; // Add extra padding
        this.div.offsetHeight; // Trigger a layout update
    }

    async convertAndRender(): Promise<void> {
        const markdownContent = this.input_area.getValue();
        try {
            const renderedHTML = await this.convertMarkdownToHTML(markdownContent);
            this.rendered_content.innerHTML = renderedHTML;
            this.input_area.setValue(markdownContent); // Keep the markdown content
            (this.div.querySelector('textarea') as HTMLTextAreaElement).style.display = 'none';
            this.rendered_content.style.display = 'block';
            
            // Add margin to the first child of rendered content
            const firstChild = this.rendered_content.firstElementChild;
            if (firstChild) {
                (firstChild as HTMLElement).style.marginTop = '0';
            }
            
            // Adjust the cell height
            this.updateHeight(this.rendered_content.scrollHeight);
        } catch (error) {
            console.error('Error converting markdown to HTML:', error);
            // Handle the error appropriately, e.g., show an error message to the user
        }
    }

    async convertMarkdownToHTML(markdown: string): Promise<string> {
        return marked(markdown);
    }
}