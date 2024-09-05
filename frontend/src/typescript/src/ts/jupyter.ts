import { Debugger } from "./windows/debugger";
import { Explorer } from "./windows/explorer";
import { Terminal } from "./windows/terminal";
import { Editor } from "./windows/editor/editor";
import { DarkMode } from "./themes/darkmode/darkmode";
import { AddMenu } from "./components/editor/menu/add_menu";
import { ObjectManager } from "./managers/object_manager";
import { Chat } from "./components/gpt/chat";
import { WebSocketCodeCell } from "./components/ws_client/ws_code_cell";
import { WebSocketChatGPT } from "./components/ws_client/ws_chatgpt";

// Instantiate the ObjectManager
const objectManager = ObjectManager.getInstance();

// Define your WebSocket instances
const localWebSocketURL = `ws://localhost:8080/ws`;
const codeSocket = 'codeSocket';
const aiSocket = 'aiSocket';

let _debugger = new Debugger(objectManager);
let _explorer = new Explorer();
let _terminal = new Terminal();

const handleCodeSocketOpen = (socket: WebSocket) => {
    console.log('Running custom code after WebSocket connection is established.');
    objectManager.addWebSocket(codeSocket, socket);

    let editor = objectManager.getObject('editor');
    if (!editor) {
        console.log('Creating new editor instance...');
        editor = new Editor(socket, objectManager);
        objectManager.associate('editor', editor);
        editor.addCodeCell();
         // Check if AddMenu already exists
    let addMenu = objectManager.getObject('addMenu');
    if (!addMenu) {
        console.log('Creating new AddMenu instance...');
        addMenu = new AddMenu(objectManager);
        objectManager.associate('addMenu', addMenu);
    }

    }


   
};

const wsClientCodeCell = new WebSocketCodeCell(
    `${localWebSocketURL}/${codeSocket}`,
    codeSocket,
    handleCodeSocketOpen
);

const handleChatGPTSocketOpen = (socket: WebSocket) => {
    objectManager.addWebSocket(aiSocket, socket);
    console.log('Running custom code after WebSocket connection is established.');
    let _chat = new Chat(socket);
};

const wsClientChatGPT = new WebSocketChatGPT(
    `${localWebSocketURL}/${aiSocket}`,
    aiSocket,
    handleChatGPTSocketOpen
);

document.addEventListener("keydown", function (e) {
    if (e.key === "F1") {
        console.log("darkmode");
        e.stopPropagation();
        e.preventDefault();
        DarkMode.toggle();
    }
});