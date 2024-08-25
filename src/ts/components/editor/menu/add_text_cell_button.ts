// Bar in top left of the screen for basic actions like add cell, remove cell

import { ObjectManager } from "../../../managers/object_manager";
import { createIconLabel, createImgDiv } from "./utility";
import { Editor } from "../../../windows/editor";

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
        div.style.top = "1.5vh";
        div.style.left = "91vw";
        div.style.zIndex = "100000";

        //div size
        div.style.width = "5vw";
        div.style.height = "3.5vh";
        div.style.marginTop = "-3.5vh";
        //temp styling
        div.style.display = "flex";
        div.style.backgroundColor = "white";

        div.style.borderRadius = "10%";
        div.style.boxShadow = "0px 2px 15px 0px rgba(0, 0, 0, .2)";



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