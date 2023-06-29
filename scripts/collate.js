const fs = require("fs");
const path = require("path");

var log_path = "logs/info/new";
var heading = "ERROR, CODE, CATEGORY, NUM OCCURANCES, NUM AFFECTED SNIPPETS, FIRST ID, PERCENT";


var run = 0;
var snippets = 0;
var errorMap = {};
var totalErrors = 0;
var snippetsWithoutErrors = 0;
var fixed = 0;
var empty = 0;
var LOC = 0;
var timeout = 0;
var failed = 0;
var lineFailed = 0;

var files = fs.readdirSync(log_path)
for(var f of files){
    var headings;
    run++;
    // if(f == "npm-all-fixes1682480271279.log") continue;
    var contents = fs.readFileSync(path.join(log_path, f),{encoding: "utf-8"})
    var lines = contents.split("\n");
    csv = false;
    for(var l of lines){
        l = l.trim()
        if(l.startsWith("TOTAL SNIPPETS")){
            var num = parseInt(l.split(":")[1])
            snippets+=num;
        }
        if(l.startsWith("Total errors")){
            csv = false;
            var num = parseInt(l.split(":")[1])
            totalErrors += num;
        }
        if(l.startsWith("Snippets without errors")){
            var num = l.substring(l.indexOf(": ")+2, l.indexOf("/"));
            num = parseInt(num);
            snippetsWithoutErrors += num;
        }
        if(l.startsWith("Fixed")){
            var num = l.substring(l.indexOf(": ")+2, l.indexOf("/"));
            num = parseInt(num);
            fixed += num;
        }
        if(l.startsWith("Snippets no lines")){
            var num = l.substring(l.indexOf(": ")+2, l.indexOf("/"));
            num = parseInt(num);
            empty += num;
        }
        if(l.startsWith("Code lines")){
            var num = parseInt(l.split(":")[1])
            LOC += num;
        }
        if(l.startsWith("Snippets timed")){
            var num = l.substring(l.indexOf(": ")+2, l.indexOf("/"));
            num = parseInt(num);
            timeout += num;
        }
        if(l.startsWith("Snippets failed")){
            var num = l.substring(l.indexOf(": ")+2, l.indexOf("/"));
            num = parseInt(num);
            failed += num;
        }
        if(l.startsWith("Snippets lineFailed")){
            var num = l.substring(l.indexOf(": ")+2, l.indexOf("/"));
            num = parseInt(num);
            lineFailed += num;
        }
        if(l.startsWith("ALL FIXES ANALYSIS")) {
            csv = true;
            continue;
        }
        if(l.startsWith(heading)){
            headings = l.split(",")
            headings = headings.map((h)=>{return h.trim()})
            continue;
        }
        if(csv){
            if(!l) continue;
            var parts = l.split(",");
            var to = headings.length-1;
            var columns = [parts.slice(0, -to).join(",")]
            for(var p of parts.slice(-to)){
                columns.push(p.trim())
            }
            var code = columns[1];
            errorEntry = errorMap[code];
            if(!errorEntry){
                errorEntry = {
                    msg: columns[0],
                    code: columns[1],
                    cat: columns[2],
                    oc: parseInt(columns[3]),
                    as: parseInt(columns[4]),
                    id: columns[5],
                }
            }
            else{
                errorEntry.oc += parseInt(columns[3])
                errorEntry.as += parseInt(columns[4])
            }
            errorMap[code] = errorEntry;
            // if(parts.length != 7) console.log(l)
        }
    }
}


var writeString = "";
writeString += "DATASET INFORMATION:\n"
writeString+="TOTAL SNIPPETS: " + snippets + "\n--------\nALL FIXES ANALYSIS\n\nERROR, CODE, CATEGORY, NUM OCCURANCES, NUM AFFECTED SNIPPETS, FIRST ID, PERCENT\n";
var errors = Object.values(errorMap).sort((a, b)=>{
    return b.oc - a.oc;
});
for(var e of errors){
    writeString += [e.msg, e.code, e.cat, e.oc, e.as, e.id, (e.as/snippets)].join(", ") + "\n"
}

writeString += "\n";
writeString += "Total errors: " + totalErrors + "\n";
writeString += "Snippets without errors: " + snippetsWithoutErrors + "/" + snippets + "(" + (snippetsWithoutErrors/ snippets) + ")" + "\n";
writeString += "Fixed: " + fixed + "/" + snippets + "(" + (fixed/ snippets) + ")" + "\n";
writeString += "Snippets no lines: " + empty + "/" + snippets + "(" + (empty / snippets) + ")" + "\n";
writeString += "Code lines: " + LOC + "\n";
writeString += "Snippets timed out: " + timeout + "/" + snippets + "(" + (timeout / snippets) + ")" + "\n";
writeString += "Snippets failed: " + failed + "/" + snippets + "(" + (failed / snippets) + ")" + "\n";
writeString += "Snippets lineFailed: " + lineFailed + "/" + snippets + "(" + (lineFailed / snippets) + ")" + "\n";

fs.writeFileSync("data/runs/npm-cf-ts-dl.log", writeString, {encoding:"utf-8", flag: "w"})
// for(var l of writeString.split("\n")){
//     fs.appendFileSync(l, "/data/runs/npm-cf-ts-dl.log", {encoding:"utf-8"})
// }