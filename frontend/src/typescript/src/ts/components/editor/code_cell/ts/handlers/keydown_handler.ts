// File: src/ts/components/editor/code_cell/ts/handlers/keydown_handler.ts

import { InputArea } from "../views/child_views/input_area";
import { InputAreaEditor } from "../controllers/input_area_controller";
import { DarkMode } from "../../../../../themes/darkmode/darkmode";
import { TextCell } from "../../../text_cell/views/text_cell";

class InputAreaKeyDown {
    
    static Enter(e: KeyboardEvent, input_area: InputArea) {
        e.preventDefault();
        e.stopPropagation();
        input_area.removeDefaultBr(); //contenteditable adds <br> on pressing entering
        input_area.increaseHeight();
        console.log(`Enter pressed. Adding line after ${input_area.caretY}`);
        input_area.addLineAfter(input_area.caretY);
        console.log(`Line added after Enter press`);
        let new_code_area = input_area.getCodeAreaByLine(input_area.caretY + 1);
        if (new_code_area) {
            InputAreaEditor.moveCaretToBeginningOfCodeArea(new_code_area);
        } else {
            console.error(`Failed to get new code area for line ${input_area.caretY + 1}`);
        }
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
        e.preventDefault();
        e.stopPropagation();
        if (input_area.allSelected) {
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

    static Ctrl(e: KeyboardEvent, input_area: InputArea) {
        if (e.key === "a") {
            e.stopPropagation();
            e.preventDefault();

            //Create a range (a range is a like the selection but invisible)
            let selection = window.getSelection();
            selection?.removeAllRanges()

            for (let i=2; i <= Object.keys(input_area.grid).length+1; i++) {
                let range = document.createRange();
                let code_area = input_area.getCodeAreaByLine(i);
                let text_area = code_area?.childNodes[0];
                range.selectNode(text_area);
                selection?.addRange(range);
            }

            input_area.allSelected = true;
            console.log("all selected", input_area.allSelected);
        }

        // Replace code cell with text cell 
        if (e.key === "m") {
            console.log("CMD MMMMM")
            e.stopPropagation();
            e.preventDefault();
            let code_cell = document.getElementById("code-cell-" + input_area.cc_id.toString());
            let text_cell = new TextCell(input_area.cc_id);
            code_cell.replaceWith(text_cell.getDiv());
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