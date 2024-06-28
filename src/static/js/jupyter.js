import { AddCodeCell } from "./node/cells/code.js";

var button = document.getElementById("add_cell");
button.addEventListener("click", function(event){
    AddCodeCell()
 });

var socket;

/*
   Connect to 
*/
connectToWS().then(server => {
    socket = server;
    AddCodeCell()
    socket.onmessage = (event) => {
        console.log(event.data);
    };
});

window.onbeforeunload = function(event)
{
    socket.close();
    return confirm("Confirm refresh");
};


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



