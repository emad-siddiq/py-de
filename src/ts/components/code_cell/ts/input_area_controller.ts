class InputAreaEditor {

    /******************************************************************
                       Code Cell Textual Processing
    *******************************************************************/ 

    static decreaseCodeCellSize(div: any) {
        let currHeight = div.getBoundingClientRect().height;
        console.log("currHeight", currHeight);
        if (currHeight < 45) {
            return;
        }
        let newHeight = currHeight - 19;
        div.style.height = newHeight + "px";
        div.parentNode.style.height = div.parentNode.getBoundingClientRect().height - 19 + "px";
    }

    static increaseCodeCellSize(div: any) {
        let currHeight = div.getBoundingClientRect().height;
        let newHeight = currHeight + 19;
        div.style.height = newHeight + "px";
        div.parentNode.style.height = div.parentNode.getBoundingClientRect().height + 19 + "px";
    }

    //Returns the line if for a line # inside input_area_id
    static generateLineContainerId(input_area_id: string, line_number: number | string) {
        let line_container_id = input_area_id + "-line-number-" + line_number.toString();
        return line_container_id;
    }

    static generateLineNumberDivId(line_container_id: string) {
        let line_number_div_id = line_container_id + "-number"
        return line_number_div_id;
    }

     //Returns the line if for a line # inside input_area_id
     static generateCodeAreaDivId(line_container_id: string) {
        let line_number_div_id = line_container_id + "-code-area";
        return line_number_div_id;
    }

    //Returns the id for the div that contains the line number e.g 2. or 3.
    static getLineNumberDivId(input_area_id: string, line_number: number | string) {
        let line_container_id = InputAreaEditor.generateLineContainerId(input_area_id, line_number);
        return InputAreaEditor.generateLineNumberDivId(line_container_id);
    }

    // Return id of line# code area
    static getCodeAreaId(input_area_id: string, line_number: number | string) {
        let line_container_id = InputAreaEditor.generateLineContainerId(input_area_id, line_number);
        return InputAreaEditor.generateCodeAreaDivId(line_container_id);
    }

    // Creates a line for the input area, adding a line number and editable text area
    static createLine(input_area_id: string, line_number: number, text) {
        let line_container_id = InputAreaEditor.generateLineContainerId(input_area_id, line_number);
        let line_number_id = InputAreaEditor.generateLineNumberDivId(line_container_id);
        let code_area_id = InputAreaEditor.generateCodeAreaDivId(line_container_id);

        let line_container = document.createElement("div");
        line_container.setAttribute("id", line_container_id)
        line_container.style.display = "flex";
        line_container.style.whiteSpace = "normal";

        let line_number_div = document.createElement("div");
        line_number_div.setAttribute("id", line_number_id);
        line_number_div.setAttribute("class", line_number_id);
        line_number_div.setAttribute("contenteditable", "false");
        line_number_div.style.userSelect = "none";
        line_number_div.style.webkitUserSelect = "none";
        line_number_div.style.setProperty("-moz-user-select", "none");
        line_number_div.style.setProperty("-khtml-user-select", "none");
        line_number_div.style.setProperty("-webkit-user-select", "none");
        line_number_div.style.setProperty("-o-user-selectt", "none");

        line_number_div.textContent = line_number.toString() + ".";
        line_number_div.style.fontSize = "16px";
        line_number_div.style.color = "gray";

        //TODO: handle sidebar indent
        line_number_div.style.width = "20px";
        line_number_div.style.textAlign = "center";
        line_number_div.style.alignContent = "end";

        // if (line_number >= 10) {
        //     line_number_div.style.marginLeft = "-10px";
        // } else {
        //     line_number_div.style.paddingRight = "0px";
        // }

        //line_number_div.style.marginRight = "10px";
        line_number_div.style.paddingLeft = "5px";



        let code_area_div = document.createElement("div");
        code_area_div.setAttribute("id", code_area_id);
        code_area_div.setAttribute("class", code_area_id);
        code_area_div.setAttribute("contenteditable", "true");
        code_area_div.setAttribute("tab-index", "1");
        code_area_div.style.userSelect = "auto";

        code_area_div.style.fontSize = "16px";
        code_area_div.style.backgroundColor = "";
        code_area_div.style.whiteSpace = "pre";
        code_area_div.style.marginRight = "-10px";


        document.addEventListener("selectionchange", event=>{
            let selection: any = document.getSelection();
            //console.log(selection.anchorNode, selection.anchorOffset, selection.focusNode, selection.focusOffset, selection.direction);
            
            if (selection.anchorNode !== selection.focusNode) {

                let ranges = [];

                for (let i = 0; i < selection.rangeCount; i++) {
                    ranges[i] = selection.getRangeAt(i);
                }

                console.log(ranges);

                
                let old_line_range = ranges[0];
                old_line_range.selectNode(selection.anchorNode);
        
                let new_line_range = document.createRange();
                new_line_range.setEnd(selection.focusNode, selection.focusNode.focusOffset);
                new_line_range.setStart(selection.focusNode, selection.focusNode.textContent.length);

                selection.addRange(old_line_range);
                selection.addRange(new_line_range);

            }
        
        })



        code_area_div.textContent = text ? text : "";

        line_container.appendChild(line_number_div);
        line_container.appendChild(code_area_div);

        return line_container;
    }


    static moveCaretToEndOfCodeArea(code_area: HTMLElement) {
        let empty_code_area = false;
        if (code_area.childNodes.length === 0) {
            code_area.textContent = " ";
            empty_code_area = true;
        }
        let textNode = code_area.childNodes[0];

        let startNode = textNode;
        let startOffset = 0;
        let endNode = textNode;
        let endOffset = textNode?.textContent?.length ? textNode?.textContent?.length: startOffset;
        InputAreaEditor.moveSelection(startNode, startOffset, endNode, endOffset, false);
        if (empty_code_area) {
            code_area.textContent = "";
        }

    }



    static moveCaretToBeginningOfCodeArea(code_area: HTMLElement){
        let empty_code_area = false;
        if (code_area.childNodes.length === 0) {
            code_area.textContent = " ";
            empty_code_area = true;
        }
        let textNode = code_area.childNodes[0];
        let startNode = textNode;
        let startOffset = 0;
        let endNode = textNode;
        let endOffset = textNode?.textContent?.length ? textNode?.textContent?.length: startOffset;
        InputAreaEditor.moveSelection(startNode, startOffset, endNode, endOffset, true);

        if (empty_code_area) {
            code_area.textContent = "";
        }


    }


    static moveCaretToIndexOfCodeArea(code_area: HTMLElement, index: number) {
        let empty_code_area = false;
        if (code_area.childNodes.length === 0) {
            code_area.textContent = " ";
            empty_code_area = true;
        }

        let textNode = code_area.childNodes[0];
        let startNode = textNode;
        let startOffset = index;
        let endNode = textNode;
        let endOffset = index;
        InputAreaEditor.moveSelection(startNode, startOffset, endNode, endOffset);
        if (empty_code_area) {
            code_area.textContent = "";
        }

    }


    static moveSelection(startNode: Node, startOffset: number, endNode: Node, endOffset: number, toStart?: boolean) {

        let range = document.createRange();//Create a range (a range is a like the selection but invisible)
        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);

        if (toStart !== undefined) {
            range.collapse(toStart); //collapse range to beginning (true) or end (false)
        }

        let selection = window.getSelection();//get the selection object (allows you to change selection)
        selection?.removeAllRanges();//remove any selections already made
        selection?.addRange(range);//make the range you have just created the visible selection
    }

// Char check:
// https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key#specifications
// https://en.wikipedia.org/wiki/List_of_Unicode_characters
 
    static isAlphaNumericChar(key: string): boolean {
        //https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key#specifications
        if (key.length > 1 || key.length == 0) {
            return false;
        }
        let utf_16 = key.charCodeAt(0);

        let a_to_z = (ch) => {
            //console.log("a to z", key, ch);
            return ch >= 97 && ch <= 122; 
        }

        let A_TO_Z = (ch) => {
            //console.log("A to Z", key, ch);
            return ch >= 65 && ch <= 90;
        }

        let zero_to_nine = (ch) => {
            //console.log("1 to 9", key, ch);
            return ch >= 48 && ch <= 57;
        };

        return a_to_z(utf_16) || A_TO_Z(utf_16) || zero_to_nine(utf_16);

    }


    static isSpecialChar(key: string): boolean {
        //(UTF 16 33-47 and 58-64 inclusive)
        // ! " # $ % & ' ( ) * + , - . /  : ; < = > ? @  
        // console.log(String.fromCharCode(i));
        if (key.length > 1 || key.length == 0) {
            return false;
        }
        let utf_16 = key.charCodeAt(0);

        return utf_16 >= 33 && utf_16 <= 47 || utf_16 >= 58 && utf_16 <= 64;

    }


}

export {InputAreaEditor};