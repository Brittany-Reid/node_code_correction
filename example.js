const NCC = require(".");

var snippets = [
    `const {username, email} = await prompt.get(['username', 'email']);`
];

async function main(){
    var compiled = await NCC.getErrors(snippets);
    console.log(compiled[0].errors)

    var fixed = await NCC.fix(snippets);
    console.log(fixed[0].code)
}

main();