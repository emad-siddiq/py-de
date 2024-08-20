
function removeElement(id: string) {
    var elem = document.getElementById(id);
    return elem?.parentNode?.removeChild(elem);
}

export {removeElement}