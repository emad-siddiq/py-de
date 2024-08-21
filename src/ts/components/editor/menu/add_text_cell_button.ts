// Bar in top left of the screen for basic actions like add cell, remove cell

import { createIconLabel, createImgDiv } from "./utility.js";

class AddTextCellButton {
    id: string;
    div: HTMLElement;
    constructor() {
        this.id = "add-text-cell";
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
        div.style.position = "sticky";
        //div position from top-left term corner in terms of view-width and view-height
        div.style.top = "1vh";
        div.style.left = "93vw";
        div.style.zIndex = "1000";

        //div size
        div.style.width = "4vw";
        div.style.height = "3vh";
        div.style.marginTop = "-3vh";
        //temp styling
        div.style.backgroundColor = "#f2ebf2";
        div.style.display = "flex";

        //Add child nodes
        div.appendChild(this.addTextCellButton());

        //Return div with styling set
        div.style.justifyContent = "start";
        div.style.alignItems = "center";
        return div;
        
    }
    
    addTextCellButton(): HTMLElement {
        let div = document.createElement("div");

        div.appendChild(createImgDiv("add-text-cell-icon", "./../img/svg/plus.svg"));
        div.appendChild(createIconLabel("text-cell-label", "Text"));

        div.style.display = "flex";
        div.style.fontSize = "18px";

        return div;
    }

 



}

export {AddTextCellButton}