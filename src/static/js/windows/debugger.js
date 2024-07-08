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
        div.style.top = 0;
        div.style.left = window.innerWidth - 0.3 * window.innerWidth;
        div.style.backgroundColor = "orange";
        div.style.width = window.innerWidth * 0.3;
        div.style.height = "100%";
        div.style.zIndex = 10;
        return div;
    }

    toggle() {
        let editor = document.getElementById("editor");
        let terminal = document.getElementById("terminal");

        if (document.getElementById("debugger")) {
            editor.style.width = editor.getBoundingClientRect().width + this.div.getBoundingClientRect().width;

            if (terminal) {
                terminal.style.width =  terminal.getBoundingClientRect().width + this.div.getBoundingClientRect().width;
            }
            document.body.removeChild(this.div)
        } else {
            document.body.appendChild(this.div);
            console.log("this.div", this.div);
            console.log( editor.getBoundingClientRect().width - this.div.getBoundingClientRect().width);
            editor.style.width = editor.getBoundingClientRect().width - this.div.getBoundingClientRect().width;
            if (terminal) {
                terminal.style.width = terminal.getBoundingClientRect().width - this.div.getBoundingClientRect().width;
            }
        }
     
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

export {Debugger};