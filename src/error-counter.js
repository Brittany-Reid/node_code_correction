

class ErrorCounter{
    constructor(){
        this.map = new Map();
    }

    add(error, id){
        var message = error.message;
        var errorCode = error.code;
        var rule = this.getRule(errorCode, message);
        var data = this.map.get(errorCode);
        if(!data) data = {
            occurances: 0,
            affectedSnippets: new Set(),
            code: errorCode,
            rule: rule,
        }
        data.affectedSnippets.add(id);
        data.occurances++;
        this.map.set(errorCode, data);
    }

    getRule(code, message){
        var rule = message;
        // generics from https://github.com/Microsoft/TypeScript/blob/main/src/compiler/diagnosticMessages.json
        switch(code){
            case 2304:
                rule = "Cannot find name"
                break;
            case 1005:
                rule = "Character expected"
                break;
            case 2365:
                rule = "Operator cannot be applied to types 1 and 2"
                break;
            case 1435:
                rule = "Unknown keyword or identifier"
                break;
            case 2307:
                rule = "Cannot find module"
                break;
            default:
                break;
        }
        return rule;
    }

    get(key){
        return this.map.get(key)
    }

    getKeys(){
        var keys = Array.from(this.map.keys());
        keys.sort((a, b)=>{
            var aValue = this.map.get(a).occurances;
            var bValue = this.map.get(b).occurances;
            return bValue - aValue;
        })
        return keys;
    }

}

module.exports = ErrorCounter