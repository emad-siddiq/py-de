import { ObjectManager } from "../../../../managers/object_manager";
import '@material/web/textfield/filled-text-field';
import '@material/web/textfield/outlined-text-field';
import '@material/web/button/filled-button';
import '@material/web/icon/icon';

const localWebSocketURL = `http://localhost:8080/ws`; //TODO: Change this to be a websocket
const deploySocket = 'deploySocket';

class AWSForm {
    private form: HTMLFormElement;
    private overlay: HTMLDivElement;
    private submitButton: HTMLElement | null;
    private errorMessage: HTMLDivElement | null;
    private inProgressCircle: HTMLDivElement | null;
    private userInitiatedSubmit: boolean;

    constructor() {
        this.userInitiatedSubmit = false;
        this.form = this.createForm();
        this.overlay = this.createOverlay();
        this.submitButton = this.form.querySelector("md-filled-button");
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
        form.style.borderRadius = "8px";
        form.style.zIndex = "1001";
        form.style.visibility = 'hidden';
        form.style.opacity = '0';
        form.style.transition = 'visibility 0.3s, opacity 0.3s';
        form.style.fontFamily = "Roboto, sans-serif";
        form.style.fontSize = "16px";
        form.style.width = "300px";

        const title = document.createElement("h2");
        title.textContent = "Connect to AWS";
        title.style.margin = "0 0 20px 0";
        title.style.fontSize = "24px";
        title.style.color = "#333";

        const createTextField = (name: string, label: string, type: string = "text") => {
            const field = document.createElement("md-outlined-text-field") as HTMLElement & {
                label: string;
                type: string;
                name: string;
            };
            field.label = label;
            field.type = type;
            field.name = name;
            field.style.width = "100%";
            field.style.marginBottom = "16px";
            return field;
        };

        const sshUserInput = createTextField("sshUser", "SSH User");
        const sshKeyPathInput = createTextField("sshKeyPath", "SSH Key Path");
        const sshHostName = createTextField("sshHostName", "SSH Host Name");


        const submitButton = document.createElement("md-filled-button") as HTMLElement & {
            type: string;
        };
        submitButton.textContent = "Submit";
        submitButton.type = "submit";
        submitButton.style.width = "100%";

        form.appendChild(title);
        form.appendChild(sshUserInput);
        form.appendChild(sshKeyPathInput);
        form.appendChild(sshHostName);
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

        if (this.inProgressCircle) {
            this.inProgressCircle.style.display = 'block';
        }

        const formData = new FormData(this.form);
        const credentials = {
            sshUser: formData.get("sshUser") as string,
            sshKeyPath: formData.get("sshKeyPath") as string,
            sshHostName: formData.get("sshHostName") as string,

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
                this.updateWebSocketConnections(data.wsBaseURL);
            } else {
                this.showError(data.errorMessage || 'An error occurred');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            this.showError('Failed to connect to the backend');
        })
        .finally(() => {
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