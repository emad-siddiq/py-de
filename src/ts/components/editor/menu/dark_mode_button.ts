// Bar in top left of the screen for basic actions like add cell, remove cell

import { DarkMode } from "../../../themes/darkmode/darkmode.js";
import { createIconLabel, createImgDiv } from "./utility.js";

class DarkModeButton {
    id: string;
    div: HTMLElement;
    constructor() {
        this.id = "dark-mode-icon";
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
        div.style.position = "absolute";
        //div position from top-left term corner in terms of view-width and view-height
        div.style.top = "1vh";
        div.style.left = "97vw";
        div.style.zIndex = "3";

        //div size
        div.style.width = "4vh";
        div.style.height = "4vh";
        //temp styling
        //div.style.backgroundColor = "#f2ebf2";
        div.style.display = "flex";

        //Add child nodes
        div.appendChild(this.addDarkModeButton());

        //Return div with styling set
        return div;
        
    }

    addDarkModeButton(): HTMLElement {
        let div = document.createElement("div");

        div.appendChild(createImgDiv("add-text-cell-icon", "./../img/svg/dark_mode.svg"));
        div.style.display = "flex";
        return div;
    }


    addEventListeners() {
        this.div.addEventListener('click', () => {
            DarkMode.toggle()
        })
            
    }
    





}

export {DarkModeButton}