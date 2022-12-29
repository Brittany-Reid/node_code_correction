const { fork } = require('child_process');
const path = require('path');
const { getBaseDirectory } = require('../common');

const TIMEOUT = 60000;
const SERVER = path.join(getBaseDirectory(), "src/compiler/compiler-server.js");


/**
 * The compiler class has timeout functionality.
 * It uses compiler-server.js.
 */
class Compiler{
    constructor(){
        //start the server
        this.forked = fork(SERVER);
    }

    async compile(code){
        //if needs to be restarted
        if(this.forked.killed){
            this.forked = fork(SERVER);
        }

        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.forked.kill('SIGKILL')
                reject("Timeout");
            }, TIMEOUT);

            //errorhandler doesn't know what 'this' is
            var forked = this.forked;
            function errorHandler(msg){
                //remove otherwise we add again each time
                forked.removeListener("message", errorHandler)
                clearTimeout(timer);
                //if string undefined
                if(typeof msg === "string") reject(msg)
                resolve(msg);
            }

            this.forked.addListener("message", errorHandler)
            this.forked.send(code);


            // setTimeout(()=>{
            //     reject();
            // }, 100)
        });
    }

    close(){
        this.forked.kill()
    }
}

module.exports = Compiler