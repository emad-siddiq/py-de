
import { Debugger } from "./windows/debugger";
import { Explorer } from "./windows/explorer";
import { Terminal } from "./windows/terminal";
import { Menu } from "./windows/drop_down_menu/menu";
import { Editor } from "./windows/editor";
import {DarkMode} from "./themes/darkmode/darkmode";
import { InputAreaEditor } from "./components/editor/code_cell/ts/controllers/input_area_controller";
import { AddMenu } from "./components/editor/menu/add_menu";
import { ObjectManager } from "./managers/object_manager";
import { Chat } from "./components/gpt/chat";
import { WebSocketClientCodeCell } from "./components/ws_client/ws_client";
import { WebSocketClientChatGPT } from "./components/ws_client/ws_client_chatgpt";


/*
   Connect to WS for sending Python code to backend.
*/
//let _menu = new Menu(); TODO: Finish implementing the top menu bar

// Instantiate the ObjectManager
const objectManager = ObjectManager.getInstance();

// Define your WebSocket instances
const socketId1 = 'codeSocket';
const socketId2 = 'aiSocket';

let _debugger = new Debugger(objectManager);
let _explorer = new Explorer();
let _terminal = new Terminal();



// TODO: Reveal menu on hover against top
// TODO: File --> Open, select local .ipynb and render correctly 
// TODO: File --> Open, select local .md and render correctly


const wsClientCodeCell = new WebSocketClientCodeCell(
    'ws://localhost:8080/v1/ws',
    (_socket) => {
        console.log('Running custom code after WebSocket connection is established.');
        objectManager.addWebSocket(socketId1, _socket);

        let _editor = new Editor(_socket, objectManager);
        let _add_menu = new AddMenu(objectManager);
    
        _editor.addCodeCell();
        //DarkMode.enable();
    
        let code_area = document.getElementById("code-cell-1-input-area-line-number-1-code-area");
        InputAreaEditor.moveCaretToEndOfCodeArea(code_area);
        code_area.focus();

        //Close connection before reloading
window.onbeforeunload = function(event)
{
    objectManager.getWebSocket(socketId1).close();

    return confirm("Confirm refresh");
};
        
    }
);

const wsClientChatGPT = new WebSocketClientChatGPT(
    'ws://localhost:8080/v1/ws/chatgpt',
    (_socket) => {

        objectManager.addWebSocket(socketId2, _socket);

        console.log('Running custom code after WebSocket connection is established.');       
        let _chat = new Chat(_socket);
    //Close connection before reloading
window.onbeforeunload = function(event)
{
    objectManager.getWebSocket(socketId2).close();
    return confirm("Confirm refresh");
};
       
    
    }
);



document.addEventListener("keydown", function(e) {
    if (e.key === "F1") {
        console.log("darkmode");
        e.stopPropagation();
        e.preventDefault();
        DarkMode.toggle();
    }
})



