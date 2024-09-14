
class CodeCellNumber {
    id: string;
    divId: string;
    div: HTMLElement;

    constructor(id){ 
        this.id = id;
        this.divId = "code-cell-number-" + id;
        this.div = this.createCodeCellNumber();
    }

    getDiv() {
        return this.div;
    }

    createCodeCellNumber() {
        let code_cell_number = document.createElement("div");
        code_cell_number.innerHTML = "[" + this.id + "]"; 

        code_cell_number.setAttribute("id", this.divId);
        code_cell_number.setAttribute("class", this.divId);
    
        //code_cell_number.style.position = "relative";
        code_cell_number.style.zIndex = "5";
        code_cell_number.style.boxSizing = "border-box";
        code_cell_number.style.marginTop = "30px";
        code_cell_number.style.paddingRight = "5px";
        code_cell_number.style.fontFamily = "ui-monospace,SFMono-Regular,\"SF Mono\",Menlo,Consolas,\"Liberation Mono\",monospace";
    
        return code_cell_number;
    }

}

export {CodeCellNumber};


