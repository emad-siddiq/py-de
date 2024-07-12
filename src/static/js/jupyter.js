var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Debugger } from "./windows/debugger.js";
import { Explorer } from "./windows/explorer.js";
import { Terminal } from "./windows/terminal.js";
import { Editor } from "./windows/editor.js";
import { DarkMode } from "./themes/darkmode/darkmode.js";
import { InputAreaEditor } from "./components/code_cell/ts/input_area_controller.js";
var socket;
/*
   Connect to WS for sending Python code to backend.
*/
let _debugger = new Debugger();
let _explorer = new Explorer();
let _terminal = new Terminal();
// TODO: Reveal menu on hover against top
// TODO: File --> Open, select local .ipynb and render correctly 
// TODO: File --> Open, select local .md and render correctly
connectToWS().then(server => {
    socket = server;
    let _editor = new Editor(socket);
    _editor.addCodeCell();
    //DarkMode.enable();
    let code_area = document.getElementById("code-cell-1-input-area-line-number-1-code-area");
    InputAreaEditor.moveCaretToEndOfCodeArea(code_area);
    //code_area.focus();
    socket.onmessage = (event) => {
        console.log(event.data);
    };
});
//Close connection before reloading
window.onbeforeunload = function (event) {
    socket.close();
    return confirm("Confirm refresh");
};
document.addEventListener("keydown", function (e) {
    if (e.shiftKey && e.key === "Tab") {
        console.log("darkmode");
        e.stopPropagation();
        e.preventDefault();
        DarkMode.toggle();
    }
});
// let transition_start = "e66465";
// let transition_end = "9198e5"
// setInterval(function() {
//     let editor = document.getElementById("editor");
//     editor.style.backgroundImage = "linear-gradient(#e66465, #9198e5)";
// }, 1000);
// function incrementHex(hex) {
//     let incrementHex   // TODO: 
// }
function connectToWS() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let server = yield connect();
            console.log("connected to socket");
            return server;
            // ... use server
        }
        catch (error) {
            console.log("ooops ", error);
        }
    });
}
function connect() {
    return new Promise(function (resolve, reject) {
        var server = new WebSocket('ws://localhost:8080/v1/ws');
        server.onopen = function () {
            resolve(server);
        };
        server.onerror = function (err) {
            reject(err);
        };
    });
}
