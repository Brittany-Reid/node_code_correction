/**
 * @fileoverview 
 * File soCodeBlockVersions contains all Node.js accepted answer code block versions from sotorrent.
 * To represent snippet 'error fixes', we only want:
 *  - Snippets with a change.
 *  - Snippet versions representing the original state.
 *  - Snippets versions representing the fixed state.
 *  - Check the compiler errors
 *  - Get only snippets where compiler errors improved.
 */

const fs = require("fs");
const path = require("path");
const NCC = require("../index.js");

var dataPath = "data";
var sourcePath = path.join(dataPath, "soCodeBlockVersions.json")
var targetPath = path.join(dataPath, "soFixes.json")
var targetPath2 = path.join(dataPath, "soFixesImprove.json")
var targetPath3 = path.join(dataPath, "soFixesFixed.json")


var source = fs.readFileSync(sourcePath, {encoding: "utf-8"});

var entries = [];
var snippets = []

//filter for edits:
function getFirstLastEntries(){
    // is a newline delim JSON (each entry on a newline)
    for(var l of source.split("\n")){
        if (!l) continue;
        var entry = JSON.parse(l)
        // ignore snippets with no edits
        if(entry["PredCount"] == 0 && entry["SuccCount"] == 0){
            continue;
        }
        // ignore entries that are not first or last
        if(!(entry["PredCount"] == 0 || entry["SuccCount"] == 0)){
            continue;
        }
        entries.push(entry);
    }

}

function collateSnippets(){
    //map snippets by postid+localid to versions
    var snippetMap = {}
    for(var e of entries){
        var id = e["PostId"] + "_" + e["LocalId"];
        if(snippetMap[id] == undefined){
            snippetMap[id] = [e]
        }
        else{
            snippetMap[id].push(e)
        }
    }
    
    for(var s of Object.values(snippetMap)){
        //filter these cases
        //i assume localid shifts or maybe THIS block doesn't change
        //some have a predLocalId but some don't
        //https://stackoverflow.com/posts/4754806/revisions is a good example
        //this case has more than 2 pred=0 snippets because blocks were added
        if(s.length !== 2){
            continue;
        }
    
        //sort by predcount so first version is first
        s = s.sort((a, b) => {
            a = a["PredCount"]
            b = b["PredCount"]
            if(a < b) return -1;
            if(a > b) return 1;
            return 0;
        })
    
        //create unified entry
        var entry = s[0]
        var snippet = {
            PostId : entry["PostId"],
            LocalId : entry["LocalId"],
            Versions : []
        }
    
        for(var sn of s){
            snippet["Versions"].push({
                PredCount: sn["PredCount"],
                PredEqual: sn["PredEqual"],
                PredSimilarity: sn["PredSimilarity"],
                Content: sn["Content"],
                MostRecentVersion: sn["MostRecentVersion"]
            })
        }
    
        snippets.push(snippet)
    }
}


function filterClones(){
    //filter cases that are the exact same
    snippets = snippets.filter(s => {
        var versions = s["Versions"];
        if(versions[0]["Content"] === versions[1]["Content"]){
            return false;
        }
        return true
    })
}

//compile snippets
async function getErrors(){
    //get batch to do
    var code = []
    for(var s of snippets){
        for(var v of s["Versions"]){
            code.push(v["Content"]);
        }
    }

    //compile
    var compiled = NCC.getErrors(code);
    var i = 1
    NCC.evaluator.on("compile", ()=>{
        if(i % 100 == 0){
            //updating progress
            process.stdout.write(i + "/" + code.length + '\r');
        }
        i++
    })
    compiled = await compiled;
    console.log(compiled.length)

    //update with error info
    var c = 0;
    for(var s of snippets){
        for(var v of s["Versions"]){
            var errors = compiled[c].errors;
            if(errors) v["Errors"] = errors.length;
            else{
                v["Errors"] = 0
            }
            c++;
        }
    }
}

//filter errors
function filterByErrors(){
    snippets = snippets.filter((s)=>{
        var versions = s["Versions"];
        var first = versions[0]
        if(first["Errors"] === 0){
            return false;
        }
        //where the new case introduces new errors? //i think this may be interesting
        // if (s["Versions"][0].errors < s["Versions"][1].errors)
        return true;
    })
}

function improvedOnly(){
    snippets = snippets.filter((s)=>{
        var versions = s["Versions"];
        var first = versions[0]
        var second = versions[1]
        if(first["Errors"] < second["Errors"]){
            return false;
        }
        return true;
    })
}

function fixedOnly(){
    snippets = snippets.filter((s)=>{
        var versions = s["Versions"];
        var first = versions[0]
        var second = versions[1]
        if(second["Errors"] == 0){
            return true;
        }
        return false;
    })
}

async function main(){
    getFirstLastEntries()
    collateSnippets()
    filterClones()
    await getErrors(); //this step takes some time
    filterByErrors();
    console.log("Snippets: " + snippets.length)
    //write
    fs.writeFileSync(targetPath, JSON.stringify(snippets,null, 2), {encoding:"utf-8"})
    //filter by improved only
    improvedOnly();
    console.log("Snippets: " + snippets.length)
    //write
    fs.writeFileSync(targetPath2, JSON.stringify(snippets,null, 2), {encoding:"utf-8"})
    //filter by to no errors only
    fixedOnly();
    console.log("Snippets: " + snippets.length)
    //write
    fs.writeFileSync(targetPath3, JSON.stringify(snippets,null, 2), {encoding:"utf-8"})
}

main()

// var snippets = JSON.parse(fs.readFileSync(targetPath, {encoding:"utf-8"}));



// for(var s of snippets.slice(0, 5)){
//     var versions = s["Versions"];
//     // console.log("ORIGINAL:")
//     // console.log(versions[0]["Content"])
//     // console.log("--")
//     // console.log("MOST RECENT:")
//     console.log(versions[1]["Content"])
//     console.log("--------------------------------")
// }