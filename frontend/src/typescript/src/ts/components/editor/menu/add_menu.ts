// Bar in top left of the screen for basic actions like add cell, remove cell

import { ObjectManager } from "../../../managers/object_manager";
import { AddCodeCellButton } from "./add_code_cell_button";
import { AddTextCellButton } from "./add_text_cell_button";
import { DropdownComputeSelectionMenu } from "./compute_select/drop_down_compute_selection_menu";
import { DarkModeButton } from "./dark_mode_button";


class AddMenu {
    objectManager: ObjectManager;

    constructor(objectManger: ObjectManager) {
        this.objectManager = objectManger;
        new DropdownComputeSelectionMenu(); 
        new AddCodeCellButton(this.objectManager);
        new AddTextCellButton(this.objectManager);
        new DarkModeButton();
        this.objectManager.associate('addMenu', this);
    }


}

export {AddMenu}