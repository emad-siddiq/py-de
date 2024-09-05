export class FileName {
    private fileNameDiv: HTMLDivElement;
    private fileName: string;

    constructor(initialFileName: string = "Untitled") {
        this.fileName = initialFileName;
        this.fileNameDiv = this.createDiv();
    }

    public createDiv(): HTMLDivElement {
        let fileNameDiv: HTMLDivElement = document.createElement("div");
        fileNameDiv.setAttribute("id", "filename");
        fileNameDiv.setAttribute("class", "filename");
    
        // Initial setup for the div
        fileNameDiv.innerHTML = this.fileName;
        fileNameDiv.style.fontSize = "24px";
        fileNameDiv.style.width = "150px";
        fileNameDiv.style.display = "inline-block";
        fileNameDiv.style.fontFamily = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";
        fileNameDiv.style.marginBottom = "10px";
        fileNameDiv.style.paddingTop = "10px";
        fileNameDiv.style.paddingLeft = "10px";
        fileNameDiv.style.boxSizing = "border-box";
    
        fileNameDiv.addEventListener("dblclick", this.enableEditing.bind(this));
    
        return fileNameDiv;
    }

    private enableEditing(): void {
        const input: HTMLInputElement = document.createElement("input");
        input.type = "text";
        input.value = this.fileName;
        input.style.fontSize = "24px";
        input.style.width = "auto";
        input.style.minWidth = "150px";
        input.style.display = "inline-block";
        input.style.fontFamily = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";
        input.style.marginBottom = "10px";
        input.style.paddingTop = "10px";
        input.style.paddingLeft = "10px";
        input.style.boxSizing = "border-box";

        this.fileNameDiv.replaceWith(input);
        input.focus();

        const measureSpan: HTMLSpanElement = document.createElement("span");
        measureSpan.style.position = "absolute";
        measureSpan.style.visibility = "hidden";
        measureSpan.style.whiteSpace = "pre";
        measureSpan.style.fontSize = "24px";
        measureSpan.style.fontFamily = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";
        document.body.appendChild(measureSpan);

        const updateDivSize = (): void => {
            measureSpan.textContent = input.value || "Untitled";
            const newWidth = measureSpan.offsetWidth + 20;
            this.fileNameDiv.style.width = `${newWidth}px`;
            input.style.width = `${newWidth}px`;
        };

        updateDivSize();

        input.addEventListener("blur", () => {
            this.fileName = input.value;
            this.fileNameDiv.innerHTML = this.fileName;
            this.fileNameDiv.style.width = 'auto';
            input.replaceWith(this.fileNameDiv);
            document.body.removeChild(measureSpan);
        });

        input.addEventListener("keydown", (event: KeyboardEvent) => {
            if (event.key === "Enter") {
                input.blur();
            }
        });

        input.addEventListener("input", updateDivSize);
    }

    public getDiv(): HTMLDivElement {
        return this.fileNameDiv;
    }

    public getFileName(): string {
        return this.fileName;
    }

    public setFileName(newName: string): void {
        this.fileName = newName;
        this.fileNameDiv.innerHTML = this.fileName;
    }
}