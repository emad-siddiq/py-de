// Bar in top left of the screen for basic actions like add cell, remove cell

class AddMenu {
    id: string;
    div: HTMLElement;
    constructor() {
        this.id = "add-menu";
        this.div = this.createDiv();
        document.body.appendChild(this.div);

    }

    createDiv():HTMLElement {
        // Create div node
        let div = document.createElement("div");
        div.setAttribute("id", this.id);
        div.setAttribute("class", this.id);
        div.style.boxSizing = "border-box";

        // Set location in browser window
        div.style.position = "absolute";
        //div position from top-left term corner in terms of view-width and view-height
        div.style.top = "5vh";
        div.style.left = "60vw";
        div.style.zIndex = "3";

        //div size
        div.style.width = "30vw";
        div.style.height = "10vh";
        //temp styling
        div.style.backgroundColor = "red";


        //Add child nodes
        div.appendChild(this.addCellIcon());
        
        //Return div with styling set
        return div;
        
    }

    addCellIcon(): HTMLElement {
        return this.createImgDiv("add-cell-icon", "./../img/svg/plus.svg");
    }


    createImgDiv(id: string, path: string) {
        let div = document.createElement("div");
        div.setAttribute("id", id);
        div.setAttribute("class", id);
        var image = new Image();
        image.src = path;
        image.style.width = "2vw";
        image.style.height = "2vw";
        image.style.position = "relative";
        image.style.top = "0vh";
        image.style.left = "0vw";
        div.appendChild(image);
        return div;
    }



}

export {AddMenu}