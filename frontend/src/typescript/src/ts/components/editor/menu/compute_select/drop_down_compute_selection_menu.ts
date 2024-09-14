import { ObjectManager } from "./../../../../managers/object_manager";
import { AWSForm } from "./aws_form";

class DropdownComputeSelectionMenu {
    private dropdown: HTMLDivElement;
    private select: HTMLDivElement;
    private options: HTMLDivElement;
    private selectedOption: HTMLDivElement;

    constructor() {
        this.dropdown = this.createDropdown();
        document.body.appendChild(this.dropdown);
        this.addEventListeners();
    }

    private createDropdown(): HTMLDivElement {
        const dropdown = document.createElement('div');
        dropdown.style.position = 'absolute';
        dropdown.style.top = '1.5vh';
        dropdown.style.right = '17vw';
        dropdown.style.width = '150px';
        dropdown.style.height = '5vh';

        dropdown.style.fontFamily = 'Roboto, sans-serif';
        dropdown.style.fontSize = '14px';
        dropdown.style.zIndex = '1000';

        this.select = document.createElement('div');
        this.select.style.backgroundColor = '#f5f5f5';
        this.select.style.border = '1px solid #ddd';
        this.select.style.borderRadius = '4px';
        this.select.style.padding = '8px 12px';
        this.select.style.cursor = 'pointer';
        this.select.style.userSelect = 'none';
        this.select.style.display = 'flex';
        this.select.style.justifyContent = 'space-between';
        this.select.style.alignItems = 'center';

        this.selectedOption = document.createElement('div');
        this.selectedOption.textContent = 'Switch OS';

        const arrow = document.createElement('div');
        arrow.textContent = '▼';
        arrow.style.fontSize = '12px';

        this.select.appendChild(this.selectedOption);
        this.select.appendChild(arrow);

        this.options = document.createElement('div');
        this.options.style.display = 'none';
        this.options.style.position = 'absolute';
        this.options.style.top = '100%';
        this.options.style.left = '0';
        this.options.style.right = '0';
        this.options.style.backgroundColor = 'white';
        this.options.style.border = '1px solid #ddd';
        this.options.style.borderTop = 'none';
        this.options.style.borderRadius = '0 0 4px 4px';
        this.options.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';

        const optionLocal = this.createOption('Local', 'local');
        const optionAWS = this.createOption('Connect to AWS', 'aws');

        this.options.appendChild(optionLocal);
        this.options.appendChild(optionAWS);

        dropdown.appendChild(this.select);
        dropdown.appendChild(this.options);

        return dropdown;
    }

    private createOption(text: string, value: string): HTMLDivElement {
        const option = document.createElement('div');
        option.textContent = text;
        option.dataset.value = value;
        option.style.padding = '8px 12px';
        option.style.cursor = 'pointer';

        option.addEventListener('mouseover', () => {
            option.style.backgroundColor = '#f0f0f0';
        });

        option.addEventListener('mouseout', () => {
            option.style.backgroundColor = 'white';
        });

        option.addEventListener('click', (e) => this.handleOptionClick(e));

        return option;
    }

    private addEventListeners(): void {
        this.select.addEventListener('click', () => this.toggleOptions());
        document.addEventListener('click', (e) => this.handleClickOutside(e));
    }

    private toggleOptions(): void {
        this.options.style.display = this.options.style.display === 'none' ? 'block' : 'none';
    }

    private handleClickOutside(event: MouseEvent): void {
        if (!this.dropdown.contains(event.target as Node)) {
            this.options.style.display = 'none';
        }
    }

    private handleOptionClick(event: Event): void {
        const option = event.target as HTMLDivElement;
        const selectedValue = option.dataset.value;
        this.selectedOption.textContent = option.textContent;
        this.options.style.display = 'none';

        console.log(`Dropdown selection changed to: ${selectedValue}`);
        if (selectedValue === "aws") {
            console.log("Connecting to AWS selected");
            const awsForm = new AWSForm();
            awsForm.show();  // Show the AWS form when AWS is selected
        } else if (selectedValue === "local") {
            ObjectManager.getInstance().updateWebSocketConnections("http://localhost:8080/ws");
        }
    }
}

export { DropdownComputeSelectionMenu };