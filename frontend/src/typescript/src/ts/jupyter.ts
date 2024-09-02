
import { Debugger } from "./windows/debugger";
import { Explorer } from "./windows/explorer";
import { Terminal } from "./windows/terminal";
import { Menu } from "./windows/drop_down_menu/menu";
import { Editor } from "./windows/editor";
import { DarkMode } from "./themes/darkmode/darkmode";
import { InputAreaEditor } from "./components/editor/code_cell/ts/controllers/input_area_controller";
import { AddMenu } from "./components/editor/menu/add_menu";
import { ObjectManager } from "./managers/object_manager";
import { Chat } from "./components/gpt/chat";
import { WebSocketCodeCell } from "./components/ws_client/ws_code_cell";
import { WebSocketChatGPT } from "./components/ws_client/ws_chatgpt";


/*
   Connect to WS for sending Python code to backend.
*/
//let _menu = new Menu(); TODO: Finish implementing the top menu bar

// Instantiate the ObjectManager
const objectManager = ObjectManager.getInstance();

// Define your WebSocket instances
const localWebSocketURL = `ws://localhost:8080/ws`;
const codeSocket = 'codeSocket';
const aiSocket = 'aiSocket';

let _debugger = new Debugger(objectManager);
let _explorer = new Explorer();
let _terminal = new Terminal();



// TODO: Reveal menu on hover against top
// TODO: File --> Open, select local .ipynb and render correctly 
// TODO: File --> Open, select local .md and render correctly


const wsClientCodeCell = new WebSocketCodeCell(
    `${localWebSocketURL}/${codeSocket}`,
    (_socket) => {
        console.log('Running custom code after WebSocket connection is established.');
        objectManager.addWebSocket(codeSocket, _socket);  //Store websocket using its path

        let editor = objectManager.getObject('editor');
        if (!editor) {
            console.log('Creating new editor instance...');
            editor = new Editor(_socket, objectManager);
            objectManager.associate('editor', editor);
        }

        try {
            editor.initializeOrRefresh(_socket);
        } catch (error) {
            console.error('Error during editor initialization/refresh:', error);
            // You might want to add some fallback behavior here
        }

        let _add_menu = new AddMenu(objectManager);

        //DarkMode.enable();


        const wsClientChatGPT = new WebSocketChatGPT(
            `${localWebSocketURL}/${aiSocket}`,
            (_socket) => {
                objectManager.addWebSocket(aiSocket, _socket);
                console.log('Running custom code after WebSocket connection is established.');
                let _chat = new Chat(_socket);

            }
        );


    }
);


//Close connections before reloading
window.onbeforeunload = function (event) {
    objectManager.getWebSocket(codeSocket).close();
    objectManager.getWebSocket(aiSocket).close();

    return confirm("Confirm refresh");
};




document.addEventListener("keydown", function (e) {
    if (e.key === "F1") {
        console.log("darkmode");
        e.stopPropagation();
        e.preventDefault();
        DarkMode.toggle();
    }
})



