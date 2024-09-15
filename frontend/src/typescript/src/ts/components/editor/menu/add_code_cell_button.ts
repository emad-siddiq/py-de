import { ObjectManager } from "../../../managers/object_manager";
import { Editor } from "../../../windows/editor/editor";

class AddCodeCellButton {
    id: string;
    button: HTMLButtonElement;
    objectManager: ObjectManager;

    constructor(objectManager: ObjectManager) {
        this.objectManager = objectManager;
        this.id = "add-code-cell";
        this.button = this.createButton();
        objectManager.associate(this.id, this);
        this.addEventListeners();
        document.body.appendChild(this.button);
    }

    createButton(): HTMLButtonElement {
        const button = document.createElement('button');
        button.id = this.id;
        
        // Create a container for icon and text
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';
        container.style.width = '100%';

        // Create icon and text elements
        const icon = document.createElement('span');
        icon.textContent = '+';
        icon.style.fontSize = '24px';
        icon.style.marginRight = '4px';
        icon.style.lineHeight = '1';

        const text = document.createElement('span');
        text.textContent = 'Code';
        text.style.fontSize = '14px';

        // Append icon and text to the container
        container.appendChild(icon);
        container.appendChild(text);

        // Append the container to the button
        button.appendChild(container);
        
        // Styling
        button.style.position = 'fixed';
        button.style.top = '1.5vh';
        button.style.right = '9vw';
        button.style.zIndex = '1000';
        button.style.height = '3vh';
        button.style.minWidth = '3vw';
        button.style.padding = '0 10px';
        button.style.backgroundColor = '#1664c0';
        button.style.color = '#FFFFFF';
        button.style.border = 'none';
        button.style.borderRadius = '4px';
        button.style.cursor = 'pointer';
        button.style.fontFamily = 'Arial, sans-serif';
        button.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';

        // Hover effect
        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = '#1258a8';
        });
        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = '#1664c0';
        });
        
        return button;
    }

    addEventListeners() {
        this.button.addEventListener('click', () => {
            const editor = this.objectManager.getObject("editor") as Editor;
            editor.addCodeCell();
        });
    }
}

export { AddCodeCellButton }