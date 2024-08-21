// Bar in top left of the screen for basic actions like add cell, remove cell

import { ObjectManager } from "../../../managers/object_manager.js";
import { createIconLabel, createImgDiv } from "./utility.js";
import { Editor } from "../../../windows/editor.js";

class AddTextCellButton {
    id: string;
    div: HTMLElement;
    objectManager: ObjectManager;

    constructor(objectManager: ObjectManager) {
        this.objectManager = objectManager;
        this.id = "add-text-cell";
        this.div = this.createDiv();
        document.body.appendChild(this.div);
        this.addEventListeners();
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

    addEventListeners() {
        this.div.addEventListener('click', () => {
            let _editor = this.objectManager.getObject("editor") as Editor;
            _editor.addTextCell();
        })
            
    }

 



}

export {AddTextCellButton}