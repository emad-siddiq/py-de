import { Terminal as XtermTerminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { ObjectManager } from '../managers/object_manager';
import 'xterm/css/xterm.css';

export class Terminal {
    private div: HTMLElement;
    private titleBar: HTMLElement;
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
    private isFullscreen: boolean = false;
    private isResizing: boolean = false;
    private initialHeight: number;
    private initialY: number;

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

    private createTerminalDiv(): HTMLElement {
        const div = document.createElement("div");
        div.id = "custom-terminal";
        div.style.position = "fixed";
        div.style.bottom = "0";
        div.style.left = "0";
        div.style.width = "100%";
        div.style.height = "40%";
        div.style.minHeight = "100px";
        div.style.zIndex = "9998";
        div.style.display = "none";
        div.style.backgroundColor = "#1e1e1e";
        div.style.overflow = "hidden";
        div.style.boxSizing = "border-box";
        div.style.borderTop = "1px solid #555";
        div.style.boxShadow = "0 -2px 10px rgba(0,0,0,0.3)";
        
        this.titleBar = document.createElement("div");
        this.titleBar.style.height = "28px";
        this.titleBar.style.backgroundColor = "#323233";
        this.titleBar.style.display = "flex";
        this.titleBar.style.alignItems = "center";
        this.titleBar.style.padding = "0 10px";
        this.titleBar.style.cursor = "ns-resize";

        this.titleBar.addEventListener('mousedown', this.startResizing.bind(this));
        document.addEventListener('mousemove', this.resize.bind(this));
        document.addEventListener('mouseup', this.stopResizing.bind(this));

        const trafficLights = document.createElement("div");
        trafficLights.style.display = "flex";
        trafficLights.style.gap = "6px";

        const colors = ["#ff5f56", "#ffbd2e", "#27c93f"];
        const actions = ["close", "minimize", "maximize"];
        colors.forEach((color, index) => {
            const light = document.createElement("div");
            light.style.width = "12px";
            light.style.height = "12px";
            light.style.borderRadius = "50%";
            light.style.backgroundColor = color;
            light.style.cursor = "pointer";
            light.onclick = (e) => {
                e.stopPropagation();
                this[actions[index]]();
            };
            trafficLights.appendChild(light);
        });

        this.titleBar.appendChild(trafficLights);
        div.appendChild(this.titleBar);

        return div;
    }

    private startResizing(e: MouseEvent): void {
        if (this.isFullscreen) return;
        this.isResizing = true;
        this.initialHeight = this.div.offsetHeight;
        this.initialY = e.clientY;
    }

    private resize(e: MouseEvent): void {
        if (!this.isResizing || this.isFullscreen) return;
        const deltaY = this.initialY - e.clientY;
        const newHeight = Math.max(100, this.initialHeight + deltaY);
        this.div.style.height = `${newHeight}px`;
        this.fitAddon.fit();
    }

    private stopResizing(): void {
        this.isResizing = false;
    }

    private close(): void {
        this.clearTerminal();
        this.hide();
    }

    private minimize(): void {
        this.hide();
    }

    private maximize(): void {
        this.isFullscreen = !this.isFullscreen;
        if (this.isFullscreen) {
            this.div.style.top = "0";
            this.div.style.left = "0";
            this.div.style.width = "100%";
            this.div.style.height = "100%";
        } else {
            this.div.style.top = "auto";
            this.div.style.bottom = "0";
            this.div.style.left = "0";
            this.div.style.width = "100%";
            this.div.style.height = "40%";
        }
        this.fitAddon.fit();
    }

    private hide(): void {
        this.isOpen = false;
        this.div.style.display = "none";
    }

    private show(): void {
        this.isOpen = true;
        this.div.style.display = "block";
        this.fitAddon.fit();
        this.xterm.focus();
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
            this.show();
            if (!this.xterm.element) {
                this.xterm.open(this.div.querySelector("#terminal-content") || this.div);
                this.initializeTerminal();
            } else {
                this.xterm.clear();
                this.xterm.reset();
                this.xterm.write('\x1b[H');
                this.displayLoginInfo();
                this.promptUser();
            }
        } else {
            this.hide();
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
        if (key.length === 1 && key.charCodeAt(0) >= 32 && key.charCodeAt(0) <= 126) {
            const currentRow = this.xterm.buffer.active.cursorY;
            const currentCol = this.xterm.buffer.active.cursorX;
            
            if (currentCol >= this.xterm.cols - 1) {
                this.xterm.write('\r\n');
            }

            this.xterm.write(key);
            this.currentLine = this.currentLine.slice(0, this.cursorPosition) + key + this.currentLine.slice(this.cursorPosition);
            this.cursorPosition++;

            if (currentRow >= this.xterm.rows - 1) {
                this.xterm.scrollLines(1);
            }
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
        this.xterm.clear();
        this.xterm.reset();
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

    private updateSocket(newSocket: WebSocket) {
        this.socket = newSocket;
        console.log(`Terminal updated with new WebSocket`);
        this.requestEnvironmentInfo();
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
        
        const envLines = info.split('\n');
        envLines.forEach(line => {
            if (line.startsWith('USER=')) {
                this.username = line.split('=')[1].trim();
            } else if (line.startsWith('HOSTNAME=')) {
                this.hostname = line.split('=')[1].trim();
            }
        });

        if (this.isOpen) {
            this.clearTerminal();
            this.displayLoginInfo();
            this.promptUser();
        }
    }
}