function fourSpacesOnTab(event) {
    console.log(event.key);
    if (event.key === 'Tab') {
       event.preventDefault();
       console.log(event);
       let caret_index = getCaretCharOffset(this);
       let out = insertTabAtIndex(this.innerText, caret_index); 
        console.log(out);
        this.innerHTML = out;
        this.focus();
    }
}

function getCaretCharOffset(element) {
    var caretOffset = 0;
  
    if (window.getSelection) {
      var range = window.getSelection().getRangeAt(0);
      var preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(element);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      caretOffset = preCaretRange.toString().length;
    } 
  
    else if (document.selection && document.selection.type != "Control") {
      var textRange = document.selection.createRange();
      var preCaretTextRange = document.body.createTextRange();
      preCaretTextRange.moveToElementText(element);
      preCaretTextRange.setEndPoint("EndToEnd", textRange);
      caretOffset = preCaretTextRange.text.length;
    }
  
    return caretOffset;
  }

function insertTabAtIndex(text, index) {
    let out = "";
    for (let i = 0; i < text.length; i++) {
        let ch = text.charAt(i);
        if (i == index) {
            out += " ".repeat(4);
        } else if (ch == "\n") {
            out += "\\n" ;
        } else {
            out += ch;
        }
    }
    return out;
}


export {fourSpacesOnTab, getCaretCharOffset}