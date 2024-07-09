class DarkMode {

    static enabled = false;

    static toggle() {
        if (DarkMode.enabled) {
            DarkMode.disable();
            DarkMode.enabled = false;
        } else {
            DarkMode.enable();
            DarkMode.enabled = true;
        }
    }

    static disable() {
        document.body.style.backgroundColor = "white";
        let editor = document.getElementById("editor");
        editor.style.backgroundColor = "white";
        editor.style.color = "black";
        
        let nodes = document.querySelectorAll('[contenteditable="true"]');
        for (let node of nodes) {
           node.style.backgroundColor = "white";
           node.style.color = "black";
           node.style.boxShadow = "0px 2px 15px 0px rgba(0, 0, 0, .1)";

        }
    }

    static enable() {
        document.body.style.backgroundColor = "rgb(30,30,30)";
        let editor = document.getElementById("editor");
        editor.style.backgroundColor = "rgb(10,15,22)";
        editor.style.color = "white";
        editor.style.backgroundImage = "black";
        editor.style.borderColor = "black";

        
        let nodes = document.querySelectorAll('[contenteditable="true"]');
        for (let node of nodes) {
           node.style.backgroundColor = "black";
           node.style.color = "white";
           node.style.boxShadow = "0px 5px 15px 5px rgba(20, 255, 60, .2)";
        }
        
    }
}

export {DarkMode};