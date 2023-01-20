const assert = require("assert");
const { readFileSync } = require("fs");
const ts = require("typescript");
const TSFixer = require("../../src/ts/ts-fixer");

require("mocha")

var result;
var diagnostics = ts.Diagnostics;
var codes = {};
for(var d of Object.keys(diagnostics)){
    d = diagnostics[d];
    codes[d.code] = d.key
}
var fixList = JSON.parse(readFileSync("data/fixList.json")) //i had to modify the sourcecode to get this

describe("TypeScript Information", ()=>{
    beforeEach(()=>{
        result = undefined;
    })
    
    it("Version", ()=>{
        result = ts.version
    })
    it("Number of Diagnostics", ()=>{
        result = Object.keys(diagnostics).length
    })
    it("Number of Errors with Code Fixes", ()=>{
        result = ts.getSupportedCodeFixes().length
    })
    it("Number of Code Fixes", ()=>{
        result = fixList.length + " (This number was manually mined on version 4.9.2)";
    })
    it("Top 10 Errors have fixes?", ()=>{
        var common = [2304, 1005, 1434, 1127, 1109, 17004, 2695, 1128, 2552, 1003];
        result = [];
        for(var c of common){
            var message = codes[c];
            if(ts.getSupportedCodeFixes().includes(c.toString())){
                result.push(c + " ✓")
            }
            else{
                result.push(c + " x")
            }
        }
        //result.push("(This doesn't seem right as 2552 has a fix)")
        result = result.join("\n")
    })

    afterEach(()=>{
        if(result) {
            result = result.toString()
            console.log(
                result.split("\n").map((l) => "\t" + l).join("\n")
            );
        }
    })
})