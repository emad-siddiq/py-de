import {InputAreaEditor} from "./input_area_controller.js";

class InputArea {

    constructor(parentId) {
        this.id = parentId + "-input-area";
        this.div = this.createInputArea();
        this.addEventListeners();
        this.line_number = 1;
        this.caretX = 0;
        this.caretY = 0;
    }

    getDiv() {
        return this.div;
    }

    getCurrLineNumber() {
        return this.line_number;
    }

    createInputArea(id) {
        let input_area = document.createElement("div");

        input_area.setAttribute("contenteditable", true);
        input_area.setAttribute("id", this.id);
        input_area.setAttribute("class", this.id);

        //let randColor = '#'+(Math.random()*0xFFFFFF<<0).toString(16);
        input_area.style.backgroundColor = "white"; //TODO extract to theme
        input_area.style.zIndex = "2";
        input_area.style.position = "absolute";
        input_area.style.top = "10px";
        input_area.style.left = "3%";
        input_area.style.boxSizing = "border-box";
        input_area.style.paddingTop = "10px";
        input_area.style.textIndent = "0.5%";
        input_area.style.boxShadow = "0px 2px 15px 0px rgba(0, 0, 0, .1)";
        input_area.style.width = "96.25%";
        input_area.style.height = "40px";
        input_area.appendChild(this.createFirstLineNumberDiv());
        input_area.style.fontFamily = "ui-monospace,SFMono-Regular,\"SF Mono\",Menlo,Consolas,\"Liberation Mono\",monospace";



        return input_area;
    }   


     createFirstLineNumberDiv() {
        let div = document.createElement("div");
        let span = document.createElement("span");
        span.setAttribute("id", "line-number-1");
        span.setAttribute("class", "line-number-1");
        span.setAttribute("contenteditable", "false");
        span.innerText = "1.";
        span.style.fontSize = "15px";
        span.style.color = "gray";


        let span2 = document.createElement("span");
    
        span2.innerText = "Start Typing...";
        span2.style.paddingLeft = "5px";

        div.appendChild(span);
        div.appendChild(span2);

        return div;
    }

    addLine() {
        this.line_number += 1;
        let line = InputAreaEditor.createLine(this.id, this.line_number);
        this.div.appendChild(line);
    }

    addEventListeners() {
        this.div.addEventListener("keydown", InputAreaEditor.handleInput.bind(this));
    }

       

}

export {InputArea};