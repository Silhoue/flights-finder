const fs = require("fs");
const fetch = require("node-fetch");
const space = 4;

function fetchAndSave(ryanairUrl, wizzairUrl, mergeResults, filePath) {
    return Promise.all([
        fetch(ryanairUrl)
            .then(function (response) {
                return response.json();
            }),
        fetch(wizzairUrl)
            .then(function (response) {
                return response.json();
            })
        ])
        .then(function (response) {
            writeToFile(mergeResults(response), filePath);
        })
        .catch(function(error) {
            console.log(error.stack)
        });
}

function writeToFile(sourceObject, destinationFilePath) {
    fs.writeFile(destinationFilePath, JSON.stringify(sourceObject, null, space), function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log("Saved " + Object.keys(sourceObject).length + " entries.");
        }
    });
}

module.exports = {
	fetchAndSave,
	writeToFile
}