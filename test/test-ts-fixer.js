require("mocha");
var assert = require("assert");
const TSFixer= require("../src/ts/ts-fixer");

var fixer = new TSFixer();

describe("TSFixer", function () {
    describe("functions", function () {
        it("Should fix spelling", async function () {
            var code = "consle.log('a')";
            var fixed = fixer.fix(code);
            assert.strictEqual(fixed, "console.log('a')")
        });
        it("Should handle no errors", async function () {
            var code = "console.log('b')";
            var fixed = fixer.fix(code);
            assert.strictEqual(fixed, code);
        });
        it("Should be isolated from NCC", async function () {
            //TS will try to look up our index.js, with NCC object with function fix
            var code = "const a = require('.');\n a.fix();";
            var fixed = fixer.fix(code);
            //it would usually give us a missing argument error on fix, but we expect no errors
            assert.strictEqual(fixer.lastDiagnostics.length, 0);
        });
        it("Should be isolated from packages", async function () {
            //Module resolution is not set so this won't lookup ESLint anyway.
            //I THINK that's how that works?
            var code = "const eslint = require('eslint');\n eslint.Lintr();";
            var fixed = fixer.fix(code);
            //just confirm the same as above however in case anything changes
            assert.strictEqual(fixer.lastDiagnostics.length, 0);
        });
        it("example of ts-fix procedure applying multiple fixes", async function () {
            //this matches ts-fix 
            var code = "assert(false)";
            var fixed = fixer.fix(code);
            assert.strictEqual(fixed, "const assert = require(\"assert\");\n\n" +
            "assert(false)\n\n" + 
            "function assert(arg0) {\n" +
            "    throw new Error(\"Function not implemented.\");\n"+
            "}\n"
            )
        });
        //the preceeding compile is used to mark these error snippets
        //ATM we are using the two APIs (compiler and LS) but LS could replace it
        //and be run in a timeoutable process similarly
        // it("Should handle timeout case", function(){
        //     var code = '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n'+
        //     '!!!                         IMPORTANT NOTE                         !!!\n' +
        //     '!!!  MULTIPLAYER LOBBIES CREATED BY ONE ACCOUNT ARE LIMITED TO 4.  !!!\n' +
        //     '!!! THIS IS A WORK IN PROGRESS. THINGS MIGHT CHANGE WITHOUT NOTICE !!!\n' +
        //     '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!';
        //     var fixed = fixer.fix(code);
        //     //just confirm the same as above however in case anything changes
        //     assert.strictEqual(fixer.lastDiagnostics.length, 0);
        // })
        // it("Should handle error case", async function () {
        //     //Module resolution is not set so this won't lookup ESLint anyway.
        //     //I THINK that's how that works?
        //     var code = `import AsyncStorage from '@react-native-community/async-storage';\n\n`+
        //     `...\n\n` +
        //     `<ReduxWrapper\n` +
        //     `  persistorStorageOverride={ AsyncStorage }\n` +
        //     `<\n` +
        //     `...\n` +
        //     `</ReduxWrapper>\n\n` +
        //     `...\n`;
        //     var fixed = fixer.fix(code);
        //     //just confirm the same as above however in case anything changes
        //     assert.strictEqual(fixer.lastDiagnostics.length, 0);
        // });
    });
});