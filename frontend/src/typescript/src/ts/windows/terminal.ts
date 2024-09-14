import { Terminal as XtermTerminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

export class Terminal {
    private div: HTMLElement;
    private xterm: XtermTerminal;
    private fitAddon: FitAddon;
    private isOpen: boolean = false;
    private currentLine: string = '';
    private cursorPosition: number = 0;

    constructor() {
        this.div = this.createTerminalDiv();
        this.xterm = new XtermTerminal({
            cursorBlink: true,
            fontSize: 12,
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            theme: {
                background: '#000000',
                foreground: '#ffffff',
                cursor: '#ffffff',
            },
            rows: 24,
            cols: 80,
            convertEol: true,
            disableStdin: true,
            letterSpacing: 0,
            lineHeight: 1,
        });
        this.fitAddon = new FitAddon();
        this.xterm.loadAddon(this.fitAddon);
        
        document.addEventListener("keydown", this.toggleBinding.bind(this));
        window.addEventListener('resize', this.handleResize.bind(this));

        this.addGlobalStyles();

        console.log('Xterm.js version:', XtermTerminal.toString());
    }

    private createTerminalDiv(): HTMLElement {
        const div = document.createElement("div");
        div.id = "custom-terminal";
        div.style.position = "fixed";
        div.style.bottom = "0";
        div.style.left = "0";
        div.style.width = "100%";
        div.style.height = "30%";
        div.style.zIndex = "1000";
        div.style.display = "none";
        div.style.backgroundColor = "#000000";
        div.style.overflow = "hidden";
        div.style.boxSizing = "border-box";
        div.style.borderTop = "1px solid #555"; // Added top gray border
        div.style.padding = "5px";
        return div;
    }

    private addGlobalStyles(): void {
        const style = document.createElement('style');
        style.textContent = `
            .xterm-helper-textarea {
                opacity: 0 !important;
                pointer-events: none !important;
                position: absolute !important;
                top: -9999px !important;
                left: -9999px !important;
            }
            .xterm-rows {
                line-height: 1 !important;
            }
            #custom-terminal .xterm {
                padding: 5px;
                padding-top: 0;
            }
            #custom-terminal .xterm-viewport {
                overflow-y: auto !important;
            }
            #custom-terminal .xterm-screen {
                image-rendering: pixelated;
            }
        `;
        document.head.appendChild(style);
    }

    public toggle(): void {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            document.body.appendChild(this.div);
            this.div.style.display = "block";
            if (!this.xterm.element) {
                this.xterm.open(this.div);
                this.initializeTerminal();
            }
            this.fitAddon.fit();
            this.xterm.focus();
        } else {
            this.div.style.display = "none";
        }
        console.log('Terminal toggled. Is open:', this.isOpen);
    }

    private initializeTerminal(): void {
        this.xterm.write('\x1b[?25l'); // Hide cursor
        this.xterm.write('\x1b[1S');   // Scroll up one line
        this.xterm.write('\x1b[1A');   // Move cursor up one line
        this.xterm.writeln('Welcome to the terminal! Type "clear" to clear the screen.');
        this.xterm.write('\x1b[?25h'); // Show cursor
        this.promptUser();

        this.xterm.onKey(({ key, domEvent }) => {
            const ev = domEvent as KeyboardEvent;
            const printable = !ev.altKey && !ev.ctrlKey && !ev.metaKey;

            if (ev.keyCode === 13) { // Enter
                this.handleEnter();
            } else if (ev.keyCode === 8) { // Backspace
                this.handleBackspace();
            } else if (printable) {
                this.handleInput(key);
            }
        });
    }

    private promptUser(): void {
        this.currentLine = '';
        this.cursorPosition = 0;
        this.xterm.write('$ ');
    }

    private handleInput(key: string): void {
        this.xterm.write(key);
        this.currentLine = this.currentLine.slice(0, this.cursorPosition) + key + this.currentLine.slice(this.cursorPosition);
        this.cursorPosition++;
    }

    private handleBackspace(): void {
        if (this.cursorPosition > 0) {
            this.cursorPosition--;
            this.currentLine = this.currentLine.slice(0, this.cursorPosition) + this.currentLine.slice(this.cursorPosition + 1);
            this.xterm.write('\b \b');
        }
    }

    private handleEnter(): void {
        this.xterm.write('\r\n');
        if (this.currentLine.trim() !== '') {
            if (this.currentLine.trim().toLowerCase() === 'clear') {
                this.clearTerminal();
            } else {
                this.xterm.writeln(`Echo: ${this.currentLine}`);
            }
            console.log('Command entered:', this.currentLine);
        }
        this.promptUser();
    }

    private clearTerminal(): void {
        this.xterm.clear();
        this.xterm.reset();
    }

    private handleResize(): void {
        if (this.isOpen) {
            this.fitAddon.fit();
            console.log('Terminal resized');
        }
    }

    private toggleBinding(e: KeyboardEvent): void {
        const ctrl_cmd = e.metaKey || e.ctrlKey;
        const CMD_SHIFT_T = ctrl_cmd && e.shiftKey && e.key.toLowerCase() === 't';
        const ctrl_tilde = ctrl_cmd && e.key === '`';

        if (CMD_SHIFT_T || ctrl_tilde) {   
            e.preventDefault();
            e.stopPropagation();           
            this.toggle();
        }
    }
}