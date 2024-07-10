class InputAreaEditor {

    /******************************************************************
                       Code Cell Textual Processing
    *******************************************************************/ 



    static decreaseCodeCellSize(div) {
        let currHeight = div.getBoundingClientRect().height;
        console.log("currHeight", currHeight);
        if (currHeight < 45) {
            return;
        }
        let newHeight = currHeight - 19;
        div.style.height = newHeight + "px";
        div.parentNode.style.height = div.parentNode.getBoundingClientRect().height - 19 + "px";
    }


    static increaseCodeCellSize(div) {
        let currHeight = div.getBoundingClientRect().height;
        let newHeight = currHeight + 19;
        div.style.height = newHeight + "px";
        div.parentNode.style.height = div.parentNode.getBoundingClientRect().height + 19 + "px";
    }


    static createLine(input_area_id, line_number, text) {
        let line_id = input_area_id + "-line-number-" + line_number.toString();
        let div = document.createElement("div");
        
        let line_number_div = document.createElement("div");
        line_number_div.setAttribute("id", line_id);
        line_number_div.setAttribute("class", line_id);
        line_number_div.setAttribute("contenteditable", "false");
        line_number_div.innerText = line_number.toString() + ".";
        line_number_div.style.fontSize = "15px";
        line_number_div.style.color = "gray";
        line_number_div.style.paddingLeft = "5px";

        line_number_div.style.display = "inline";

        let text_div = document.createElement("div");
        text_div.setAttribute("id", line_id + "-text");
        text_div.setAttribute("class", line_id + "-text");
        text_div.setAttribute("contenteditable", "true");
        text_div.setAttribute("tab-index", "1");

        text_div.style.display = "inline";
        text_div.style.fontSize = "16px";



        text_div.innerText = text ? text : "";

        div.appendChild(line_number_div);
        div.appendChild(text_div);

        return div;
    }



}

export {InputAreaEditor};