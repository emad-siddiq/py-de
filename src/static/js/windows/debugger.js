class Debugger {
    constructor() {
        this.div = this.createDebuggerDiv();
        document.body.addEventListener("keydown", this.toggleBinding.bind(this));
    }
    getDiv() {
        return this.div;
    }
    createDebuggerDiv() {
        let div = document.createElement("div");
        div.setAttribute("id", "debugger");
        div.setAttribute("class", "debugger");
        div.style.position = "absolute";
        div.style.top = "0";
        div.style.left = (window.innerWidth - 0.3 * window.innerWidth).toString();
        div.style.backgroundColor = "orange";
        div.style.width = (window.innerWidth * 0.3).toString();
        div.style.height = "100%";
        div.style.zIndex = "10";
        return div;
    }
    toggle() {
        let _editor = document.getElementById("editor");
        let _terminal = document.getElementById("terminal");
        let _debugger = document.getElementById("debugger");
        //let _explorer = document.getElementById("explorer")
        if (_debugger) {
            this.makeFullWidth(_editor);
            if (_terminal) { // 
                this.makeFullWidth(_terminal);
            }
            document.body.removeChild(_debugger);
        }
        else {
            document.body.appendChild(this.div);
            this.resizeWindowsForDebugger(_editor, _debugger, _terminal);
        }
    }
    resizeWindowsForDebugger(_editor, _debugger, _terminal) {
        let shiftEditorLeft = _editor.getBoundingClientRect().width - _debugger.getBoundingClientRect().width;
        _editor.style.width = shiftEditorLeft.toString();
        if (_terminal) {
            let shiftTerminalLeft = _terminal.getBoundingClientRect().width - _debugger.getBoundingClientRect().width;
            _terminal.style.width = shiftTerminalLeft.toString();
        }
    }
    makeFullWidth(div) {
        let fullscreen_width = div.getBoundingClientRect().width + this.div.getBoundingClientRect().width;
        div.style.width = fullscreen_width.toString();
    }
    toggleBinding(e) {
        let ctrl_cmd = e.metaKey || e.ctrlKey; // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent
        if (ctrl_cmd && e.key === 'd') {
            e.preventDefault();
            e.stopPropagation();
            this.toggle();
            return;
        }
    }
}
export { Debugger };
