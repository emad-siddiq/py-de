class LineNumberColumn {
    constructor(parentId) {
        this.id = parentId + "-line-number-column";
        this.curr_line_number = 1;
        this.div = this.createLineNumberDiv();
    } 
    
    getDiv() {
        return this.div
    }

    createLineNumberDiv() {
        let line_number_div = document.createElement("div"); // TODO: Align line number
        line_number_div.setAttribute("id", "line-number-div" );
        line_number_div.setAttribute("class", "line-number-div" );

        line_number_div.style.zIndex = "5";
        line_number_div.style.boxSizing = "border-box";
        line_number_div.style.position = "absolute";
        line_number_div.style.top = "36%";
        line_number_div.style.left = "3.5%";

        return line_number_div;
    }

    addLineNumber() {
        let line_number_div = document.getElementById(this.id);
        let line_number = document.createElement("div");
        line_number.style.lineHeight = "24px";
        line_number.innerHTML = this.line_number.toString();
        this.line_number += 1;
        line_number_div.appendChild(line_number);
    }

}

export {LineNumberColumn};