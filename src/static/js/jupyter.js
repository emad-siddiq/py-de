
import { Debugger } from "./windows/debugger.js";
import { Explorer } from "./windows/explorer.js";
import { Terminal } from "./windows/terminal.js";
import { Editor } from "./windows/editor.js";
import {DarkMode} from "./themes/darkmode/darkmode.js";

var socket;
/*
   Connect to WS for sending Python code to backend.
*/


connectToWS().then(server => {
    socket = server;
    let _editor = new Editor();
    _editor.addCodeCell();
    socket.onmessage = (event) => {
        console.log(event.data);
    };
});

//Close connection before reloading
window.onbeforeunload = function(event)
{
    socket.close();
    return confirm("Confirm refresh");
};

let _debugger = new Debugger();
let _explorer = new Explorer();
let _terminal = new Terminal();
// TODO: Reveal menu on hover against top
// TODO: File --> Open, select local .ipynb and render correctly 
// TODO: File --> Open, select local .md and render correctly


document.addEventListener("keydown", function(e) {
    if (e.shiftKey && e.key === "Tab") {
        console.log("darkmode")
        e.stopPropagation();
        e.preventDefault();
        DarkMode.toggle();
    }
})


// let transition_start = "e66465";
// let transition_end = "9198e5"

// setInterval(function() {
//     let editor = document.getElementById("editor");
//     editor.style.backgroundImage = "linear-gradient(#e66465, #9198e5)";

// }, 1000);

// function incrementHex(hex) {
//     let incrementHex   // TODO: 
// }



async function connectToWS() {
    try {
        let server = await connect()
        console.log("connected to socket")
        return server
        // ... use server
    } catch (error) {
        console.log("ooops ", error)
    }
  }

function connect() {
    return new Promise(function(resolve, reject) {
        var server = new WebSocket('ws://localhost:8080/v1/ws');
        server.onopen = function() {
            resolve(server);
        };
        server.onerror = function(err) {
            reject(err);
        };

    });
}



