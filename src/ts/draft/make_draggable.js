
//     /******************************************************************
//       If mouse dragged in resizeable div by △dy, set div height += △dy. 
//     *******************************************************************/ 
  

//       toggleDrag = (e) => {
//         console.log("mousedown;")
//         console.log("last_active_code_cell_id", this.id);
//         this.last_active_code_cell_id = this.id;
//         this.drag = true;
//     };

// handleMove = (e) => {
//         if (this.drag) {
//             let oldHeight = e.currentTarget.getBoundingClientRect().height;     
//             let dy = e.movementY;
//             this.last_active_code_cell_id = this.id;
//             e.currentTarget.style.height = oldHeight + dy;
//             console.log(e.currentTarget, e.currentTarget, this.last_active_code_cell_id);
//         }
//     };

// finishResize = (e) => {
//     console.log("mouseup");
//     console.log(this.last_active_code_cell_id);
//     let last_dragged_cell_height = document.getElementById(this.last_active_code_cell_id).getBoundingClientRect().height;
//     console.log("last cell height", last_dragged_cell_height);
//     this.drag=false;
// } 