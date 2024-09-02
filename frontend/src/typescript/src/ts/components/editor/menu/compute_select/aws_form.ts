import { ObjectManager } from "../../../../managers/object_manager";


const localWebSocketURL = `http://localhost:8080/ws`; //TODO: Change this to be a websocket
const deploySocket = 'deploySocket';



class AWSForm {
    private form: HTMLFormElement;
    private overlay: HTMLDivElement;
    private submitButton: HTMLButtonElement | null;
    private errorMessage: HTMLDivElement | null;
    private inProgressCircle: HTMLDivElement | null;
    private userInitiatedSubmit: boolean;

    constructor() {
        this.userInitiatedSubmit = false;
        this.form = this.createForm();
        this.overlay = this.createOverlay();
        this.submitButton = this.form.querySelector("button[type='submit']");
        this.errorMessage = document.createElement('div');
        this.inProgressCircle = document.createElement('div');

        this.form.appendChild(this.errorMessage);
        this.form.appendChild(this.inProgressCircle);

        document.body.appendChild(this.overlay);
        document.body.appendChild(this.form);

        this.addEventListeners();
        this.initErrorMessage();
        this.initInProgressCircle();
    }

    private createForm(): HTMLFormElement {
        const form = document.createElement("form");
        form.style.position = "absolute";
        form.style.top = "50%";
        form.style.left = "50%";
        form.style.transform = "translate(-50%, -50%)";
        form.style.backgroundColor = "#fff";
        form.style.padding = "20px";
        form.style.border = "1px solid #ccc";
        form.style.boxShadow = "0px 4px 10px rgba(0, 0, 0, 0.2)";
        form.style.borderRadius = "8px";
        form.style.zIndex = "1001";
        form.style.visibility = 'hidden';
        form.style.opacity = '0';
        form.style.transition = 'visibility 0.3s, opacity 0.3s';
        form.style.fontFamily = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";
        form.style.fontSize = "16px";

        const title = document.createElement("h2");
        title.textContent = "Connect to AWS";
        title.style.margin = "0 0 10px 0";
        title.style.fontSize = "20px";
        title.style.color = "#333";

        const accessKeyInput = document.createElement("input");
        accessKeyInput.type = "text";
        accessKeyInput.name = "accessKeyID";
        accessKeyInput.placeholder = "Access Key ID";
        accessKeyInput.required = true;
        accessKeyInput.style.width = "100%";
        accessKeyInput.style.marginBottom = "10px";
        accessKeyInput.style.padding = "8px";
        accessKeyInput.style.border = "1px solid #ccc";
        accessKeyInput.style.borderRadius = "4px";

        const secretKeyInput = document.createElement("input");
        secretKeyInput.type = "password";
        secretKeyInput.name = "secretAccessKey";
        secretKeyInput.placeholder = "Secret Access Key";
        secretKeyInput.required = true;
        secretKeyInput.style.width = "100%";
        secretKeyInput.style.marginBottom = "10px";
        secretKeyInput.style.padding = "8px";
        secretKeyInput.style.border = "1px solid #ccc";
        secretKeyInput.style.borderRadius = "4px";

        const instanceIdInput = document.createElement("input");
        instanceIdInput.type = "text";
        instanceIdInput.name = "instanceID";
        instanceIdInput.placeholder = "Instance ID";
        instanceIdInput.required = true;
        instanceIdInput.style.width = "100%";
        instanceIdInput.style.marginBottom = "10px";
        instanceIdInput.style.padding = "8px";
        instanceIdInput.style.border = "1px solid #ccc";
        instanceIdInput.style.borderRadius = "4px";

        const regionInput = document.createElement("input");
        regionInput.type = "text";
        regionInput.name = "region";
        regionInput.placeholder = "AWS Region";
        regionInput.required = true;
        regionInput.style.width = "100%";
        regionInput.style.marginBottom = "10px";
        regionInput.style.padding = "8px";
        regionInput.style.border = "1px solid #ccc";
        regionInput.style.borderRadius = "4px";

        const sshUserInput = document.createElement("input");
        sshUserInput.type = "text";
        sshUserInput.name = "sshUser";
        sshUserInput.placeholder = "SSH User";
        sshUserInput.style.width = "100%";
        sshUserInput.style.marginBottom = "10px";
        sshUserInput.style.padding = "8px";
        sshUserInput.style.border = "1px solid #ccc";
        sshUserInput.style.borderRadius = "4px";

        const sshKeyPathInput = document.createElement("input");
        sshKeyPathInput.type = "text";
        sshKeyPathInput.name = "sshKeyPath";
        sshKeyPathInput.placeholder = "SSH Key Path";
        sshKeyPathInput.style.width = "100%";
        sshKeyPathInput.style.marginBottom = "10px";
        sshKeyPathInput.style.padding = "8px";
        sshKeyPathInput.style.border = "1px solid #ccc";
        sshKeyPathInput.style.borderRadius = "4px";

        const submitButton = document.createElement("button");
        submitButton.type = "submit";
        submitButton.textContent = "Submit";
        submitButton.style.backgroundColor = "#007bff";
        submitButton.style.color = "#fff";
        submitButton.style.border = "none";
        submitButton.style.padding = "10px 20px";
        submitButton.style.borderRadius = "4px";
        submitButton.style.cursor = "pointer";
        submitButton.style.fontSize = "16px";
        submitButton.style.transition = "background-color 0.3s";

        submitButton.addEventListener("mouseover", () => {
            submitButton.style.backgroundColor = "#0056b3";
        });

        submitButton.addEventListener("mouseout", () => {
            submitButton.style.backgroundColor = "#007bff";
        });

        // Track user-initiated clicks on the submit button
        submitButton.addEventListener("pointerdown", () => {
            this.userInitiatedSubmit = true;
        });

        form.appendChild(title);
        form.appendChild(accessKeyInput);
        form.appendChild(secretKeyInput);
        form.appendChild(instanceIdInput);
        form.appendChild(regionInput);
        form.appendChild(sshUserInput);
        form.appendChild(sshKeyPathInput);
        form.appendChild(submitButton);

        return form;
    }

    private createOverlay(): HTMLDivElement {
        const overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
        overlay.style.zIndex = "1000";
        overlay.style.visibility = "hidden";
        overlay.style.opacity = "0";
        overlay.style.transition = 'visibility 0.3s, opacity 0.3s';

        return overlay;
    }

    private addEventListeners(): void {
        if (this.submitButton) {
            this.submitButton.addEventListener("click", (event) => this.handleSubmit(event));
        }
        this.overlay.addEventListener("click", this.hide.bind(this));
    }

    private initErrorMessage() {
        if (this.errorMessage) {
            this.errorMessage.style.color = 'red';
            this.errorMessage.style.display = 'none';
            this.errorMessage.style.marginTop = "10px";
        }
    }

    private initInProgressCircle() {
        if (this.inProgressCircle) {
            this.inProgressCircle.textContent = 'Loading...';
            this.inProgressCircle.style.display = 'none';
            this.inProgressCircle.style.marginTop = "10px";
        }
    }

    private handleSubmit(event: Event): void {
        event.preventDefault();

        // Only proceed if the submit was user-initiated
        if (!this.userInitiatedSubmit) {
            console.log('Form submission blocked because it was not user-initiated.');
            return;
        }

        if (this.inProgressCircle) {
            this.inProgressCircle.style.display = 'block';
        }

        const formData = new FormData(this.form);
        const credentials = {
            accessKeyID: formData.get("accessKeyID") as string,
            secretAccessKey: formData.get("secretAccessKey") as string,
            instanceID: formData.get("instanceID") as string,
            region: formData.get("region") as string,
            sshUser: formData.get("sshUser") as string,
            sshKeyPath: formData.get("sshKeyPath") as string,
        };

        fetch(`${localWebSocketURL}/${deploySocket}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        })
        .then(response => response.json())
        .then(data => {
            console.log("AWS response:", data);
            if (data.success) {
                this.showSuccessBanner();
                this.hide();
                this.updateWebSocketConnections(data.wsBaseURL); // Updated field name
            } else {
                this.showError(data.errorMessage || 'An error occurred');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            this.showError('Failed to connect to the backend');
        })
        .finally(() => {
            this.userInitiatedSubmit = false; // Reset the flag after submission
            if (this.inProgressCircle) {
                this.inProgressCircle.style.display = 'none';
            }
        });
    }

    private showSuccessBanner() {
        alert('Successfully connected to AWS!');
    }

    private showError(message: string) {
        if (this.errorMessage) {
            this.errorMessage.textContent = message;
            this.errorMessage.style.display = 'block';
        }
    }

    private updateWebSocketConnections(wsBaseURL: string) {
        const objectManager = ObjectManager.getInstance();
        console.log("Updating WebSocket connections with:", wsBaseURL);

        // Update WebSocket connections with the new IP
        objectManager.updateWebSocketConnections(wsBaseURL);
    }

    public show(): void {
        console.log("Showing AWS form");
        this.form.style.visibility = 'visible';
        this.form.style.opacity = '1';
        this.overlay.style.visibility = 'visible';
        this.overlay.style.opacity = '1';
    }

    public hide(): void {
        console.log("Hiding AWS form");
        this.form.style.visibility = 'hidden';
        this.form.style.opacity = '0';
        this.overlay.style.visibility = 'hidden';
        this.overlay.style.opacity = '0';
    }
}

export { AWSForm };