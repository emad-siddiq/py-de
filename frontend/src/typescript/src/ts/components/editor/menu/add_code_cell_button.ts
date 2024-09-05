// Bar in top left of the screen for basic actions like add cell, remove cell

import { ObjectManager } from "../../../managers/object_manager";
import { Editor } from "../../../windows/editor/editor";
import { createIconLabel, createImgDiv } from "./utility";

class AddCodeCellButton {

    id: string;
    div: HTMLElement;
    objectManager: ObjectManager;

    constructor(objectManager: ObjectManager) {
        this.objectManager = objectManager;
        this.id = "add-code-cell";
        this.div = this.createDiv();
        objectManager.associate(this.id, this);
        this.addEventListeners();
        document.body.appendChild(this.div);        // Add Code Cell + button to top hovering menu

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
        div.style.left = "85vw";
        div.style.zIndex = "1000";

        //div size
        div.style.width = "5vw";
        div.style.height = "3.5vh";

        //temp styling
        div.style.borderRadius = "10%";
        div.style.backgroundColor = "white";
        div.style.boxShadow = "0px 2px 15px 0px rgba(0, 0, 0, .2)";

        div.style.display = "flex";

        //Add child nodes
        div.appendChild(this.addCodeCellButton());

        //Return div with styling set
        div.style.justifyContent = "start";
        div.style.alignItems = "center";
        return div;
        
    }

    addEventListeners() {
        this.div.addEventListener('click', () => {
            let _editor = this.objectManager.getObject("editor") as Editor;
            _editor.addCodeCell();
        })
            
    }


    addCodeCell() {
        document.getElementById("editor");
    }
    

    addCodeCellButton(): HTMLElement {
        let div = document.createElement("div");

        div.appendChild(createImgDiv("add-code-cell-icon", "./../img/svg/plus.svg"));
        div.appendChild(createIconLabel("code-cell-label", "Code"));

        div.style.display = "flex";
        div.style.fontSize = "18px";
        div.style.justifyContent = "center";
        div.style.alignItems = "center";
        div.style.width = "5vw";

        return div;
    }



}

export {AddCodeCellButton}