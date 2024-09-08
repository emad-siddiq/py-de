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
// An object manager helps us avoid passing around classes
// Instead we map the object with an id 
const objectManager = ObjectManager.getInstance();

// Define your WebSocket instances
const localWebSocketURL = `ws://localhost:8080/ws`;
const codeSocket = 'codeSocket';
const aiSocket = 'aiSocket';

let _debugger = new Debugger(objectManager);
let _explorer = new Explorer();
let _terminal = new Terminal();
let _editor = new Editor(objectManager);

let _addMenu = new AddMenu(objectManager);
let _chat = new Chat();


const handleCodeSocketOpen =  (socket: WebSocket) => {
    objectManager.addWebSocket(codeSocket, socket);
};

const wsClientCodeCell = new WebSocketCodeCell(
    `${localWebSocketURL}/${codeSocket}`,
    codeSocket,
    handleCodeSocketOpen
);

const handleChatGPTSocketOpen = (socket: WebSocket) => {
    objectManager.addWebSocket(aiSocket, socket);
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