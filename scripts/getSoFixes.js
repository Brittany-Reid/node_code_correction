/**
 * @fileoverview 
 * File soCodeBlockVersions contains all Node.js accepted answer code block versions from sotorrent.
 * To represent snippet 'error fixes', we only want:
 *  - Snippets with a change.
 *  - Snippet versions representing the original state.
 *  - Snippets versions representing the fixed state.
 *  - Check the compiler errors
 *  - Get only snippets where compiler errors improved.
 * 
 * For some reason running this from absolute path gives different results - it might have something to do with TS finding it's definition files?
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
var snippets = [];
var snippetMap = {}

function getSnippets(){
    //map snippets by postid_RootPostBlockVersionId to versions
    for(var l of source.split("\n")){
        if (!l) continue;
        var e = JSON.parse(l)
        var id = e["PostId"] + "_" + e["RootPostBlockVersionId"];
        if(snippetMap[id] == undefined){
            snippetMap[id] = [e]
        }
        else{
            snippetMap[id].push(e)
        }
    }

    //format and filter
    var i = -1;
    for(var k of Object.keys(snippetMap)){

        var e = snippetMap[k]
        //it needs to have an original and an edit
        if(e.length < 2) continue;


        //join into a single entry
        var entry = e[0]
        var snippet = {
            PostId : entry["PostId"], //to get /a/<id>, or /posts/<id>/revisions
            RootLocalId : entry["RootLocalId"], //original location of the snippet
            RootPostBlockVersionId : entry["RootPostBlockVersionId"], //id for parent used to group by
            Versions : []
        }

        var hasMostRecent = false;
        //go through edits
        for(var sn of e){
            if(sn["MostRecentVersion"] == 1) hasMostRecent = true;

            if(sn["Id"] == sn["RootPostBlockVersionId"] //is the original version
            || sn["MostRecentVersion"] == 1){ //or is the most recent edit
                snippet["Versions"].push({
                    PredCount: sn["PredCount"],
                    PredEqual: sn["PredEqual"],
                    PredSimilarity: sn["PredSimilarity"],
                    Content: sn["Content"],
                    MostRecentVersion: sn["MostRecentVersion"]
                })
            }
        }

        if(!hasMostRecent) continue; //some cases the snippet has no most recent, see map solution which was removed from this answer https://stackoverflow.com/posts/65132128/revisions
        //lets exclude these cases, they may be removed for a reason.

        //make sure they're sorted
        snippet["Versions"] = snippet["Versions"].sort((a, b) => {
            a = a["MostRecentVersion"]
            b = b["MostRecentVersion"]
            if(a < b) return -1;
            if(a > b) return 1;
            return 0;
        })

        snippets.push(snippet);
    }

    //confirm all have two entries
    for(var s of snippets){
        var v = s["Versions"]
        if(v.length != 2){
            console.log("Error!")
            console.log(s)
        }
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
                v["Errors"] = undefined;
            }
            v["HasCode"] = compiled[c].hasCode;
            c++;
        }
    }
}

//filter errors
function filterByErrors(){
    snippets = snippets.filter((s)=>{
        var versions = s["Versions"];
        var first = versions[0]
        var second = versions[1]
        if(first["Errors"] === 0){
            return false;
        }
        if(first["Errors"] === undefined) return false; //ignore any compile fails
        if(second["Errors"] === undefined) return false; //ignore any compile fails
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
    getSnippets();
    console.log("Snippets: " + Object.keys(snippetMap).length)
    console.log("Snippet Pairs: " + snippets.length)
    filterClones()
    console.log("Snippets With Change: " + snippets.length)
    await getErrors(); //this step takes some time
    filterByErrors();
    console.log("Snippets: " + snippets.length)
    //write
    fs.writeFileSync(targetPath, JSON.stringify(snippets,null, 2), {encoding:"utf-8"})
    // filter by improved only
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