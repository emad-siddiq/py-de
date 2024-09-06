import { ObjectManager } from "./../../../../managers/object_manager";
import { AWSForm } from "./aws_form";

class DropdownComputeSelectionMenu {
    dropdown: HTMLSelectElement;

    constructor() {
        this.dropdown = this.createDropdown();
        document.body.appendChild(this.dropdown);
    }

    private createDropdown(): HTMLSelectElement {
        const select = document.createElement("select");
        select.style.position = "absolute";
        select.style.top = "1.5vh";
        select.style.left = "76vw";
        select.style.width = "8vw";
        select.style.height = "3.5vh";
        select.style.borderRadius = "10%";
        select.style.backgroundColor = "white";

        const optionLocal = document.createElement("option");
        optionLocal.value = "local";
        optionLocal.text = "Local";

        const optionAWS = document.createElement("option");
        optionAWS.value = "aws";
        optionAWS.text = "Connect to AWS";

        select.appendChild(optionLocal);
        select.appendChild(optionAWS);

        select.addEventListener("change", this.handleSelectionChange.bind(this));

        console.log("Dropdown created and added to the document");

        return select;
    }

    private handleSelectionChange(event: Event): void {
        const selectedValue = (event.target as HTMLSelectElement).value;
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
