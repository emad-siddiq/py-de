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


    static createLine(id, line_number) {
        let line_id = id + "-line-number-" + line_number.toString();
        let div = document.createElement("div");
        let span = document.createElement("span");
        span.setAttribute("id", line_id);
        span.setAttribute("class", line_id);
        span.setAttribute("contenteditable", "false");
        span.innerText = line_number.toString() + ".";
        span.style.fontSize = "15px";
        span.style.color = "gray";


        let span2 = document.createElement("span");
        span2.setAttribute("id", line_id + "-code-area");
        span2.setAttribute("class", line_id + "-code-area");

        span2.innerText = "";

        div.appendChild(span);
        div.appendChild(span2);

        return div;
    }



}

export {InputAreaEditor};