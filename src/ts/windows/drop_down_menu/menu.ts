class Menu {

    //TODO: Make windows resizeable on broswer resize
    div: HTMLElement;
    visible: boolean;


    constructor() {
        this.div = this.createMenuDiv();
        this.div.addEventListener("mouseenter", this.enable.bind(this));
        this.div.addEventListener("mouseleave", this.disable.bind(this));

        document.body.appendChild(this.div);
        console.log("Created Menu");
    }

    getDiv() {
        return this.div;
    }

    createMenuDiv() {
        let div = document.createElement("div");
        div.setAttribute("id", "menu");
        div.setAttribute("class", "menu");
        div.style.position = "absolute";
        div.style.top = "0";
        div.style.left = "0";
        div.style.backgroundColor = "#e3e2e1";
        div.style.width = "100%";
        div.style.height = "3vh";
        div.style.opacity = "0";
        div.style.zIndex = "10";
        div.style.boxSizing = "border-box";
        div.style.backgroundImage = "linear-gradient(to left, #f5ebf4, #f5e9f4)";
        div.appendChild(this.createFileDiv());
    
        return div;
    }

    createFileDiv() {
        let div = document.createElement("div");
        div.innerHTML = "File";

        div.setAttribute("id", "menu-file");
        div.setAttribute("class", "menu-file");
    
        div.style.fontSize = "1.75vh";
        div.style.color = "black";
        div.style.width = "2.5vw";
        div.style.height = "3vh";
        div.style.paddingLeft = "1vw";
        div.style.verticalAlign = "middle";
        div.style.lineHeight = "3vh";
        div.style.backgroundColor = "unset";

        div.addEventListener("mouseenter", (e) => {
            div.style.backgroundColor = "#f2d8f0";

            div.appendChild(createDropDown());
        })

        div.addEventListener("mouseleave", (e) => {
            div.style.backgroundColor = "unset";
        })


     
        return div;
    }

    

    enable(){
        let menu = document.getElementById("menu");
        let editor = document.getElementById("editor");

        menu.style.opacity = "1";
        editor.style.marginTop = "3vh";
    }

    disable() {
        let menu = document.getElementById("menu");
        menu.style.opacity = "0";
        let editor = document.getElementById("editor");

        editor.style.marginTop = "0";

    }


}

function createDropDown():HTMLElement {
    let div = document.createElement("div");
    div.setAttribute("id", "file-dropdown");
    div.setAttribute("class", "file-dropdown");

    

    div.style.backgroundColor = "#f2d8f0";
    div.style.position = "absolute";
    div.style.left = "0";
    div.style.top = "3vh";
    div.style.width = "10vw";
    div.style.height = "30vh";


    return div;
}

export {Menu};