class InputAreaEditor {

    /******************************************************************
                       Code Cell Textual Processing
    *******************************************************************/ 

    static handleInput(e) {
        e.preventDefault();
        // this = InputArea class, e.target = <div id="code-cell-1-input-area">
        // Do textprocessing with line number and figure out new height
    

        if (e.shiftKey && e.key === 'Enter') {
            this.blur()
            this.socket.send(this.value)
            return;
        }
                    
        else if (e.code === "Enter") {
            this.caretY += 1;
            e.preventDefault();
            e.stopPropagation();
            InputAreaEditor.increaseCodeCellSize(this.div);
            this.addLine();
            this.div.focus();
            document.execCommand('selectAll', false, null);
            document.getSelection().collapseToEnd();
        }
         
        else if (e.code==="Backspace") { // for backspace 
            this.caretY -= 1;
           let str = document.getElementById(this.id).innerText; // TODO: Backspace is buggy. change to innerHTML and handle

           InputAreaEditor.decreaseCodeCellSize(this.div);
            
        }

        else {
            this.caretX += 1;
            console.log(this.caretX, this.caretY);
        }


                
    }

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
    
        span2.style.paddingLeft = "5px";
        span2.innerText = " ";

        div.appendChild(span);
        div.appendChild(span2);

        return div;
    }


}

export {InputAreaEditor};