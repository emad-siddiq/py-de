import { InputArea } from "../views/child_views/input_area.js";
import { InputAreaEditor } from "../controllers/input_area_controller.js";
import { DarkMode } from "../../../../themes/darkmode/darkmode.js";
import { removeElement } from "../../../../utility/dom.js";
import { TextCell } from "../views/text_cell.js";
import { CodeCell } from "../../code_cell/ts/views/code_cell.js";
class InputAreaKeyDown {
    
    //InputArea instance is bound to these functions, since our instances are linked to divs directly
    static Enter(e: KeyboardEvent, input_area: InputArea) {
        e.preventDefault();
        e.stopPropagation();
        input_area.removeDefaultBr(); //contenteditable adds <br> on pressing entering
        input_area.increaseHeight();
        input_area.addLineAfter(input_area.caretY+1);
        let new_code_area = input_area.getCodeAreaByLine(input_area.caretY+1);
        InputAreaEditor.moveCaretToEndOfCodeArea(new_code_area);
    }


    static F1(e: KeyboardEvent, input_area: InputArea) {
        e.preventDefault();
        e.stopPropagation();
        DarkMode.toggle();
    }
 

    static ShiftTab(e: KeyboardEvent, input_area: InputArea) {
        e.stopPropagation();
        e.preventDefault();
        let code_area = input_area.getCodeAreaByLine(input_area.caretY+1);

        if (input_area.caretX < 4) {
            input_area.caretX = 0;
        } else {
            input_area.caretX -= 4;
        }

        InputAreaEditor.moveCaretToIndexOfCodeArea(code_area, input_area.caretX);
    }

    static Tab(e: KeyboardEvent, input_area: InputArea) {
            e.stopPropagation();
            e.preventDefault();
            
            let code_area = input_area.getCodeAreaByLine(input_area.caretY+1);
            let currLineFinalIndex = input_area.grid[input_area.caretY] ? input_area.grid[input_area.caretY].length - 1: 0;

            let tabMakesCaretOutOfBounds = input_area.caretX + 4 > currLineFinalIndex;
            if (tabMakesCaretOutOfBounds) {
                let extraSpacesReqired = 4 - (currLineFinalIndex - input_area.caretX); 
                input_area.addString(" ", extraSpacesReqired); 
            } else {
                input_area.caretX += 4;
                InputAreaEditor.moveCaretToIndexOfCodeArea(code_area, input_area.caretX);                                                             
            }
    }


    static Backspace(e: KeyboardEvent, input_area: InputArea) {
        // TODO handle case for selection across multiple lines
        e.preventDefault();
        e.stopPropagation();
        if (input_area.allSelected) {
            //removeElement(this.id);
    
            while (document.getElementById(input_area.id).children.length !== 1) {
                input_area.removeLine(input_area.caretY);
            }
            let code_area = input_area.getCodeAreaByLine(input_area.caretY+1);
            code_area.innerText = "";
            input_area.caretX = 0;
            input_area.grid = {};
            InputAreaEditor.moveCaretToEndOfCodeArea(code_area);

            return;
        }

        let startOfLine = input_area.caretX === 0;
        let firstLine = input_area.caretY === 0;
        if (startOfLine) {
            if (firstLine) {
                //Can't delete since beginning of first line
                return;
            }
            input_area.removeLine(input_area.caretY);
            
       } else {
            input_area.removeCharFromLine();
       }
    }


    static Space(e: KeyboardEvent, input_area: InputArea) {
        e.preventDefault();
        e.stopPropagation();
        input_area.addString(" ", 1);
    }


    static Ctrl (e: KeyboardEvent, input_area: InputArea) {
        if (e.key === "a") {
            e.stopPropagation();
            e.preventDefault();

            //Create a range (a range is a like the selection but invisible)
            let selection = window.getSelection();
            selection?.removeAllRanges()


            for (let i=1; i <= Object.keys(input_area.grid).length; i++) {
                let range = document.createRange();
                let code_area = input_area.getCodeAreaByLine(i);
                let text_area = code_area?.childNodes[0];
                range.selectNode(text_area);
                selection?.addRange(range);
            }

            input_area.allSelected = true;
            console.log("all selected", input_area.allSelected);

        }
    }


    static AlphaNumericSpecial(e: KeyboardEvent, input_area: InputArea) {
        
            console.log("shift alphnuym", e.key);
            e.preventDefault();
            e.stopPropagation();
            input_area.caretX += 1;
            input_area.addToGrid(e.key);
            let curr_code_area = input_area.getCodeAreaByLine(input_area.caretY+1);

            if (curr_code_area) {
                InputAreaEditor.moveCaretToIndexOfCodeArea(curr_code_area, input_area.caretX);
            }
    }
 



    
}


export {InputAreaKeyDown};