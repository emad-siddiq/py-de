import { MdFilledButton } from '@material/web/button/filled-button.js';
import '@material/web/button/filled-button.js';
import '@material/web/icon/icon.js';
import { ObjectManager } from "../../../managers/object_manager";
import { Editor } from "../../../windows/editor/editor";

class AddTextCellButton {
    id: string;
    button: MdFilledButton;
    objectManager: ObjectManager;

    constructor(objectManager: ObjectManager) {
        this.objectManager = objectManager;
        this.id = "add-text-cell";
        this.button = this.createButton();
        document.body.appendChild(this.button);
        this.addEventListeners();
    }

    createButton(): MdFilledButton {
        const button = new MdFilledButton();
        button.id = this.id;
        
        // Create a container for icon and text
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';
        container.style.width = '100%';

        // Create icon and text elements
        const icon = document.createElement('md-icon');
        icon.textContent = '+';
        icon.style.fontSize = '40px';
        icon.style.marginRight = '6px';

        const text = document.createElement('span');
        text.textContent = 'Text';
        text.style.fontSize = '18px';

        // Append icon and text to the container
        container.appendChild(icon);
        container.appendChild(text);

        // Append the container to the button
        button.appendChild(container);
        
        // Styling
        button.style.position = 'fixed';
        button.style.top = '1vh';
        button.style.right = '4vw'; // Changed from left to right
        button.style.zIndex = '1000';
        button.style.height = '28px';
        button.style.minWidth = 'auto';
        button.style.padding = '0 12px';
        button.style.boxShadow = "0px 2px 15px 0px rgba(0, 0, 0, .2)";
         // Set custom color
         button.style.setProperty('--md-sys-color-primary', '#CE93D8');
         button.style.setProperty('--md-sys-color-on-primary', '#FFFFFF'); // Set text color to black for better contrast
        return button;
    }

    addEventListeners() {
        this.button.addEventListener('click', () => {
            const editor = this.objectManager.getObject("editor") as Editor;
            editor.addTextCell();
        });
    }
}

export { AddTextCellButton }