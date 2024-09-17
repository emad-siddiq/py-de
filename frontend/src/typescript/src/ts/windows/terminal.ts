import { Terminal as XtermTerminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { ObjectManager } from '../managers/object_manager';
import 'xterm/css/xterm.css';

export class Terminal {
    private div: HTMLElement;
    private xterm: XtermTerminal;
    private fitAddon: FitAddon;
    private isOpen: boolean = false;
    private currentLine: string = '';
    private cursorPosition: number = 0;
    private objectManager: ObjectManager;
    private socket: WebSocket | null;
    private environmentInfo: string = '';
    private username: string = 'user';
    private hostname: string = 'macbook-pro';

    constructor() {
        this.div = this.createTerminalDiv();
        this.xterm = new XtermTerminal({
            cursorBlink: true,
            fontSize: 13,
            fontFamily: 'Menlo, Monaco, "Courier New", monospace',
            theme: {
                background: '#1e1e1e',
                foreground: '#ffffff',
                cursor: '#ffffff',
                selectionBackground: '#4d4d4d',
            },
            rows: 24,
            cols: 80,
            convertEol: true,
            disableStdin: false,
            letterSpacing: 0,
            lineHeight: 1.2,
        });
        this.fitAddon = new FitAddon();
        this.xterm.loadAddon(this.fitAddon);
        this.objectManager = ObjectManager.getInstance();
        this.socket = null;
        
        document.addEventListener("keydown", this.toggleBinding.bind(this));
        window.addEventListener('resize', this.handleResize.bind(this));

        this.addGlobalStyles();
        this.objectManager.associate('terminal', this);
        this.objectManager.subscribeToSocket("codeSocket", this.updateSocket.bind(this));

        console.log('Xterm.js version:', XtermTerminal.toString());
    }

    private updateSocket(newSocket: WebSocket) {
        this.socket = newSocket;
        console.log(`Terminal updated with new WebSocket`);
        this.requestEnvironmentInfo();
    }

    private createTerminalDiv(): HTMLElement {
        const div = document.createElement("div");
        div.id = "custom-terminal";
        div.style.position = "fixed";
        div.style.bottom = "0";
        div.style.left = "0";
        div.style.width = "100%";
        div.style.height = "40%";
        div.style.zIndex = "1000";
        div.style.display = "none";
        div.style.backgroundColor = "#1e1e1e";
        div.style.overflow = "hidden";
        div.style.boxSizing = "border-box";
        div.style.borderTop = "1px solid #555";
        div.style.borderTopLeftRadius = "10px";
        div.style.borderTopRightRadius = "10px";
        div.style.boxShadow = "0 -2px 10px rgba(0,0,0,0.3)";
        
        const titleBar = document.createElement("div");
        titleBar.style.height = "28px";
        titleBar.style.backgroundColor = "#323233";
        titleBar.style.borderTopLeftRadius = "10px";
        titleBar.style.borderTopRightRadius = "10px";
        titleBar.style.display = "flex";
        titleBar.style.alignItems = "center";
        titleBar.style.padding = "0 10px";

        const trafficLights = document.createElement("div");
        trafficLights.style.display = "flex";
        trafficLights.style.gap = "6px";

        const colors = ["#ff5f56", "#ffbd2e", "#27c93f"];
        colors.forEach(color => {
            const light = document.createElement("div");
            light.style.width = "12px";
            light.style.height = "12px";
            light.style.borderRadius = "50%";
            light.style.backgroundColor = color;
            trafficLights.appendChild(light);
        });

        titleBar.appendChild(trafficLights);
        div.appendChild(titleBar);

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
            .xterm-char-measure-element {
                display: inline-block;
                visibility: hidden;
                position: absolute;
                top: 0;
                left: -9999px;
                line-height: normal;
            }
            .xterm-rows {
                line-height: 1.2 !important;
            }
            #custom-terminal .xterm {
                padding: 10px;
            }
            #custom-terminal .xterm-viewport {
                overflow-y: auto !important;
            }
            #custom-terminal .xterm-screen {
                image-rendering: pixelated;
            }
            .xterm-decoration-overview-ruler {
                display: none !important;
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
                this.xterm.open(this.div.querySelector("#terminal-content") || this.div);
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
        this.displayLoginInfo();
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

    private displayLoginInfo(): void {
        const now = new Date();
        this.xterm.writeln(`Last login: ${now.toLocaleString()} on ttys000`);
        if (this.environmentInfo) {
            this.xterm.writeln(this.environmentInfo);
        }
    }

    private promptUser(): void {
        this.currentLine = '';
        this.cursorPosition = 0;
        this.xterm.write(`${this.username}@${this.hostname}:~$ `);
    }

    private handleInput(key: string): void {
        // Only write printable characters
        if (key.length === 1 && key.charCodeAt(0) >= 32 && key.charCodeAt(0) <= 126) {
            this.xterm.write(key);
            this.currentLine = this.currentLine.slice(0, this.cursorPosition) + key + this.currentLine.slice(this.cursorPosition);
            this.cursorPosition++;
        }
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
                this.sendCommand(this.currentLine.trim());
            }
        } else {
            this.promptUser();
        }
        this.currentLine = '';
        this.cursorPosition = 0;
    }

    private sendCommand(command: string): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({ type: 'shell', content: command });
            this.socket.send(message);
            console.log('Sent command:', command);
        } else {
            console.warn('WebSocket is not open. Cannot send command.');
            this.xterm.writeln('Error: WebSocket is not connected.');
            this.promptUser();
        }
    }

    public write(content: string): void {
        this.xterm.writeln(content);
        this.promptUser();
    }

    private clearTerminal(): void {
        // Clear the terminal and reset its state
        this.xterm.clear();
        this.xterm.reset();

        // Move cursor to the top-left corner
        this.xterm.write('\x1b[H');

        this.promptUser();
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

    private requestEnvironmentInfo(): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            const message = JSON.stringify({ type: 'env_info' });
            this.socket.send(message);
        } else {
            console.warn('WebSocket is not open. Cannot request environment info.');
        }
    }

    public updateEnvironmentInfo(info: string): void {
        this.environmentInfo = info;
        // If the terminal is already open, update the display
        if (this.isOpen) {
            this.clearTerminal();
        }
    }
}