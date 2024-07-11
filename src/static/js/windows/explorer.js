class Explorer {
    constructor() {
        this.div = this.createExplorerDiv();
        document.body.addEventListener("keydown", this.toggleBinding.bind(this));
    }
    getDiv() {
        return this.div;
    }
    createExplorerDiv() {
        let div = document.createElement("div");
        div.setAttribute("id", "explorer");
        div.setAttribute("class", "explorer");
        div.style.position = "absolute";
        div.style.top = "0";
        div.style.left = "0";
        div.style.backgroundColor = "pink";
        div.style.width = "22vw";
        div.style.height = "100%";
        return div;
    }
    toggle() {
        let editor = document.getElementById("editor");
        let terminal = document.getElementById("terminal");
        if (document.getElementById("explorer")) {
            document.body.removeChild(this.div);
            editor.style.left = "0";
            if (terminal) {
                terminal.style.left = "0";
            }
        }
        else {
            document.body.appendChild(this.div);
            editor.style.left = this.div.getBoundingClientRect().right.toString();
            if (terminal) {
                terminal.style.left = this.div.getBoundingClientRect().right.toString();
            }
        }
    }
    toggleBinding(e) {
        let ctrl_cmd = e.metaKey || e.ctrlKey; // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent
        if (ctrl_cmd && e.key === 'e') {
            this.toggle();
            return;
        }
    }
}
export { Explorer };
