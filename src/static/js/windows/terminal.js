class Terminal {
    constructor() {
        this.div = this.createTerminalDiv();
        document.body.addEventListener("keydown", this.toggleBinding.bind(this));
    }

    getDiv() {
        return this.div;
    }

    createTerminalDiv() {
        let div = document.createElement("div");
        div.setAttribute("id", "terminal");
        div.setAttribute("class", "terminal");
    
        div.style.position = "absolute";
        div.style.top = window.innerHeight - 0.3 * window.innerHeight;
        div.style.left = "0";
        div.style.backgroundColor = "green";
        div.style.width = "100%";
        div.style.height = "100%";
        div.style.zIndex = 10;

        return div;
    }

    toggle() {
        if (document.getElementById("terminal")) {
            document.body.removeChild(this.div);
        } else {
            document.body.appendChild(this.div);
        }
    }


    toggleBinding(e) {
        let ctrl_cmd = e.metaKey || e.ctrlKey; // https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent
        let CMD_SHIFT_T = ctrl_cmd && e.shiftKey && e.key === 't';
        let ctrl_tilde = ctrl_cmd && e.key == "`";

        if (CMD_SHIFT_T || ctrl_tilde) {   
                e.preventDefault();
                e.stopPropagation();           
                this.toggle();
                return;
            }
    }


}

export {Terminal};