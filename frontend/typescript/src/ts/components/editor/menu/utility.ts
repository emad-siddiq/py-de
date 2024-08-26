
function createIconLabel(id: string, label: string): HTMLElement {
    let div = document.createElement("div");
    div.setAttribute("id", id);
    div.setAttribute("class", id);

    div.innerText = label;
    div.style.alignContent = "center";
    div.style.justifyItems = "center";

    return div;
}


function createImgDiv(id: string, path: string) {
    let div = document.createElement("div");
    div.setAttribute("id", id);
    div.setAttribute("class", id);
    var image = new Image();
    image.src = path;
    image.style.width = "4vh";
    image.style.height = "4vh";
    image.style.position = "relative";
    image.style.top = "0vh";
    image.style.left = "0vw";
    div.appendChild(image);
    return div;
}


export {createIconLabel, createImgDiv}