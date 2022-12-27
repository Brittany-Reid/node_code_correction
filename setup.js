const fs = require("fs");
const path = require("path");
const axios = require("axios");
const Zip = require("adm-zip");

const DATA_URL = "https://zenodo.org/record/5094598/files/dataset.zip";
const DATA_PATH = "data/dataset.csv";
const DATA_ZIP_PATH = "data/dataset.zip";

async function download(url, path) {
    if(!fs.existsSync("data")) fs.mkdirSync("data");
    return new Promise((resolve, reject) => {
        var fileStream = fs.createWriteStream(path);

        fileStream
            .on("error", (err) => {
                console.log(err.message);
                reject(err);
            })
            .on("finish", () => {
                resolve();
            });

        axios
            .get(url, {
                responseType: "stream",
            })
            .then(function (response) {
                var total = parseInt(response.data.headers["content-length"]);
                var current = 0;
                var nextPercent = 10;

                response.data
                    .on("data", function (data) {
                        current += data.length;

                        var fraction = Math.round((current / total) * 100);
                        if (fraction >= nextPercent) {
                            console.log(nextPercent + "%");
                            nextPercent += 10;
                        }
                    })
                    .pipe(fileStream);

                //pass end to filestream
                response.data.on("end", function () {
                    fileStream.emit("end");
                });
            });
    });
}

async function setupDatabase(){
    var newDataset = false;
    if(!fs.existsSync(DATA_PATH)){
        newDataset = true;
        console.log("Dataset missing. Dataset will be downloaded from " + DATA_URL)
        await download(DATA_URL, DATA_ZIP_PATH);

        //extract to data
        console.log("Extracting from " + DATA_ZIP_PATH + " to " + path.dirname(DATA_PATH));
        var zip = new Zip(DATA_ZIP_PATH);
        zip.extractAllTo(path.dirname(DATA_PATH), true);

        //delete
        console.log("Deleting " + DATA_ZIP_PATH);
        fs.unlinkSync(DATA_ZIP_PATH);
    }
    else{
        console.log("Dataset already exists.")
    }
}

async function main(){
    setupDatabase();
}

main();
