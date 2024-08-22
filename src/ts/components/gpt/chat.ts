import { ObjectManager } from "../../managers/object_manager";
import { createImgDiv } from "../editor/menu/utility";

class Chat {
    id: string;
    div: HTMLElement;
    objectManager: ObjectManager;
    toggle: boolean;

    constructor(objectManger: ObjectManager) {
        this.id = "chat-gpt";
        this.div = this.createDiv();
        this.toggle = false;
        this.addEventListeners();
        document.body.appendChild(this.div);
        document.body.appendChild(this.createChatWindow());
    


    }

    createDiv() {
        let div = document.createElement("div");
        div.setAttribute("id", this.id);
        div.setAttribute("class", this.id);
        div.style.boxSizing = "border-box";

        // Set location in browser window
        div.style.position = "sticky";
        //div position from top-left term corner in terms of view-width and view-height
        div.style.top = "90vh";
        div.style.left = "95vw";
        div.style.zIndex = "1000";

        //div size
        div.style.width = "6vh";
        div.style.height = "6vh";
       



        //temp styling

     


        //Add child nodes
        div.appendChild(this.addChatGPTIcon());

        //Return div with styling set
        div.style.justifyContent = "start";
        div.style.alignItems = "center";
        return div;

    }

    addChatGPTIcon() {
        let div = document.createElement("div");
        div.setAttribute("id", this.id);
        div.setAttribute("class", this.id);
        var image = new Image();
        image.src = "./../img/svg/chatgpt.svg";
        image.style.width = "5vh";
        image.style.height = "5vh";
        image.style.position = "relative";
        image.style.top = "0vh";
        image.style.left = "0vw";
        image.style.borderRadius = '50%';
        image.style.objectFit = 'cover';
        div.style.display = "flex";

        div.style.alignItems = "center";
        div.style.justifyContent = "center";
        div.style.width = "8vh";
        div.style.height = "8vh";

        div.style.borderRadius = '50%';
        div.style.backgroundColor = "green";

        div.appendChild(image);
        return div;

    }

    addEventListeners() {
        this.div.addEventListener('click', () => {
            // Maximize ChatGPT window
            if (this.toggle) {
                this.minimizeChatWindow();
            } else {
                this.maximizeChatWindow();
            }
            this.toggle = !this.toggle;

        })
            
    }

    createChatWindow() {
        let div = document.createElement("div");
        div.setAttribute("id", this.id + "chat-window");
        div.setAttribute("class", this.id + "chat-window");

        div.style.position = "fixed";

        div.style.top = "50vh";
        div.style.left = "50vw";
        div.style.width = "40vw";
        div.style.height = "40vh";
        div.style.display = "none";

        div.style.zIndex = "10000";

        div.style.backgroundColor = "green";
        return div;
    }

    maximizeChatWindow() {

        let div = document.getElementById(this.id + "chat-window");
        div.style.display = "flex";


    }

    minimizeChatWindow() {
        let div = document.getElementById(this.id + "chat-window");
        div.style.display = "none";
    }


}

export {Chat}