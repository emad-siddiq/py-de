// Bar in top left of the screen for basic actions like add cell, remove cell

import { ObjectManager } from "../../../managers/object_manager";
import { AddCodeCellButton } from "./add_code_cell_button";
import { AddTextCellButton } from "./add_text_cell_button";
import { DarkModeButton } from "./dark_mode_button";


class AddMenu {
    objectManager: ObjectManager;

    constructor(objectManger: ObjectManager) {
        this.objectManager = objectManger;
        new AddCodeCellButton(this.objectManager);
        new AddTextCellButton(this.objectManager);
        new DarkModeButton();
    }


}

export {AddMenu}