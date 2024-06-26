var drag = false;


function MakeResizeableFromBottomBoundary(node) {

    let code_cell = node.previousElementSibling;

    var oldHeight = code_cell.getBoundingClientRect().height;

    var drag = false;
    node.addEventListener("mousedown", function (e) {

        console.log("mousedown;")
        drag = true;
    });

    node.addEventListener("mousemove", function (e) {
    
    if (drag) {
        console.log("mm;")
        let parent = node.parentNode;
        console.log(parent);
        parent.style.height = parent.getBoundingClientRect().height + e.movementY;

        let newHeight = oldHeight + e.movementY;
        code_cell.style.height = newHeight;
        oldHeight = newHeight;
        node.focus()
    }
    });

        document.body.addEventListener("mouseup", function (e) {
            drag=false;
            });
        
    

}

export {MakeResizeableFromBottomBoundary};
