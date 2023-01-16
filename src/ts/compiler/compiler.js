const { fork } = require('child_process');
const path = require('path');
const { getBaseDirectory } = require('../../common');

const SERVER = path.join(getBaseDirectory(), "src/ts/compiler/compiler-server.js");


/**
 * Gets errors using the TypeScript compiler.
 * It handles timeouts using a child process, unlike the TypeScriptCompiler class.
 * It runs compiler-server.js.
 */
class Compiler{
    constructor(){
        //start the server
        this.forked = fork(SERVER);
        this.timeout = 60000;
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
            }, this.timeout);

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
        });
    }

    close(){
        this.forked.kill()
    }
}

module.exports = Compiler