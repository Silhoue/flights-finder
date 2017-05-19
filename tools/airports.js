const fs = require("fs");
const fetch = require("node-fetch");

const airportsUrl = "https://api.ryanair.com/aggregate/4/common?embedded=airports";
const airportsFileName = "airports.json";
const space = 4;
const airportPrefix = /^airport:/;

function parseResponse(response) {
    var result = {};
    response.airports.forEach(function(airport) {
        var routes = airport.routes.filter(function(route) {
            return airportPrefix.test(route)
        })
        for (var i = 0; i < routes.length; i++) {
            routes[i] = routes[i].replace(airportPrefix, "");
        };
        result[airport.iataCode] = {
            name: airport.name,
            countryCode: airport.countryCode,
            currencyCode: airport.currencyCode,
            routes: routes
        };
    });
    return result;
}

function writeToFile(sourceObject, destinationFilePath) {
    fs.writeFile(destinationFilePath, JSON.stringify(sourceObject, null, space), function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log("Saved " + Object.keys(sourceObject).length + " airports data.");
        }
    });
}

fetch(airportsUrl)
    .then(function (response) {
        return response.json();
    })
    .then(function (response) {
        writeToFile(parseResponse(response), __dirname + "/" + airportsFileName);
    });