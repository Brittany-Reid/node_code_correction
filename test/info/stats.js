const assert = require("assert");
const { readFileSync } = require("fs");
const ts = require("typescript");
const eslint = require("eslint");
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

var snippetMap = {}
var codeBlockVersions = readFileSync("data/soCodeBlockVersions.json", {encoding: "utf-8"});
var so_snippets_all = JSON.parse(readFileSync("data/soFixes.json"))
var so_snippets_improve = JSON.parse(readFileSync("data/soFixesImprove.json"))
var so_snippets_fixed = JSON.parse(readFileSync("data/soFixesFixed.json"))

describe("TypeScript Information", ()=>{
    beforeEach(()=>{
        result = undefined;
    })
    
    it("Version", ()=>{
        result = []
        result.push("TypeScript: " + ts.version)
        result.push("ESLint: " + eslint.ESLint.version)
        result.push("Node: " + process.version)

        result = result.join("\n")
    })
    it("Number of Diagnostics", ()=>{
        result = Object.keys(diagnostics).length
    })
    it("Number of Errors with Code Fixes", ()=>{
        result = ts.getSupportedCodeFixes().length
    })
    it("Number of Code Fixes", ()=>{
        result = fixList.length + " (This number was manually mined on version 4.9.4)";
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
    it("SO Dataset Breakdown", ()=>{
        result = [];
        var versions = 0;
        for(var l of codeBlockVersions.split("\n")){
            if (!l) continue;
            versions++;
            var e = JSON.parse(l)
            var id = e["PostId"] + "_" + e["RootPostBlockVersionId"];
            if(snippetMap[id] == undefined){
                snippetMap[id] = [e]
            }
            else{
                snippetMap[id].push(e)
            }
        }
        result.push("Snippet Versions: " + versions)
        result.push("Unique Snippets: " + Object.keys(snippetMap).length)
        // result.push("Snippet Pairs: " + snippets.length)

        result.push("All: " + so_snippets_all.length)
        result.push("Improved: " + so_snippets_improve.length)
        result.push("Fixed: " + so_snippets_fixed.length)

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