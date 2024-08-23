
import { Debugger } from "./windows/debugger.js";
import { Explorer } from "./windows/explorer.js";
import { Terminal } from "./windows/terminal.js";
import { Menu } from "./windows/drop_down_menu/menu.js";
import { Editor } from "./windows/editor.js";
import {DarkMode} from "./themes/darkmode/darkmode.js";
import { InputAreaEditor } from "./components/editor/code_cell/ts/controllers/input_area_controller.js";
import { AddMenu } from "./components/editor/menu/add_menu.js";
import { ObjectManager } from "./managers/object_manager.js";
import { Chat } from "./components/gpt/chat.js";
import { WebSocketClientCodeCell } from "./components/ws_client/ws_client.js";
import { WebSocketClientChatGPT } from "./components/ws_client/ws_client_chatgpt.js";

var socket1;
var socket2;
/*
   Connect to WS for sending Python code to backend.
*/
//let _menu = new Menu(); TODO: Finish implementing the top menu bar

let _objectManager = new ObjectManager();

let _debugger = new Debugger(_objectManager);
let _explorer = new Explorer();
let _terminal = new Terminal();



// TODO: Reveal menu on hover against top
// TODO: File --> Open, select local .ipynb and render correctly 
// TODO: File --> Open, select local .md and render correctly


const wsClientCodeCell = new WebSocketClientCodeCell(
    'ws://localhost:8080/v1/ws',
    (_socket) => {
        console.log('Running custom code after WebSocket connection is established.');
        socket1 = _socket;
        let _editor = new Editor(socket1, _objectManager);
        let _add_menu = new AddMenu(_objectManager);
    
        _editor.addCodeCell();
        //DarkMode.enable();
    
        let code_area = document.getElementById("code-cell-1-input-area-line-number-1-code-area");
        InputAreaEditor.moveCaretToEndOfCodeArea(code_area);
        code_area.focus();

        //Close connection before reloading
window.onbeforeunload = function(event)
{
    socket1.close();
    return confirm("Confirm refresh");
};
        
    }
);

const wsClientChatGPT = new WebSocketClientChatGPT(
    'ws://localhost:8080/v1/ws/chatgpt',
    (_socket) => {
        socket2 = _socket;
        console.log('Running custom code after WebSocket connection is established.');       
        let _chat = new Chat(socket2);
    //Close connection before reloading
window.onbeforeunload = function(event)
{
    socket2.close();
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



