


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


