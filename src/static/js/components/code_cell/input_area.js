class InputArea {
    constructor(parentId) {
        this.id = parentId + "-input-area";
        this.div = this.createInputArea();
    }

    getDiv() {
        return this.div;
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
        input_area.style.top = "25%";
        input_area.style.left = "3%";
        input_area.style.boxSizing = "border-box";
        input_area.style.paddingTop = "10px";
        input_area.style.textIndent = "2%";
        input_area.style.boxShadow = "0px 2px 15px 0px rgba(0, 0, 0, .1)";
        input_area.style.width = "96.25%";
        input_area.style.height = "40px";
        input_area.innerText = "hello";
        input_area.style.fontFamily = "ui-monospace,SFMono-Regular,\"SF Mono\",Menlo,Consolas,\"Liberation Mono\",monospace";

        return input_area;
    }   

}

export {InputArea};