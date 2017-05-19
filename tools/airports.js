const fs = require("fs");
const fetch = require("node-fetch");

const ryanairAirportsUrl = "https://api.ryanair.com/aggregate/4/common?embedded=airports";
const wizzairAirportsUrl = "https://be.wizzair.com/5.1.2/Api/asset/map?languageCode=en-gb"
const airportsFileName = "airports.json";
const space = 4;
const airportPrefix = /^airport:/;

Promise.all([
    fetch(ryanairAirportsUrl)
        .then(function (response) {
            return response.json();
        }),
    fetch(wizzairAirportsUrl)
        .then(function (response) {
            return response.json();
        })
    ])
    .then(function (response) {
        var airports = mergeAirports(response[0].airports, response[1].cities);
        writeToFile(airports, __dirname + "/" + airportsFileName);
    })
    .catch(function(error) {
        console.log(error.stack)
    });


function mergeAirports(ryanairAirports, wizzairAirports) {
    var result = {};

    ryanairAirports.forEach(function (airport) {
        var routes = airport.routes.filter(function(route) {
            return airportPrefix.test(route)
        })
        for (var i = 0; i < routes.length; i++) {
            routes[i] = routes[i].replace(airportPrefix, "");
        };

        result[airport.iataCode] = {
            countryCode: airport.countryCode,
            ryanairName: airport.name,
            ryanairRoutes: routes
        };
    });

    wizzairAirports.forEach(function (airport) {
        var routes = airport.connections.reduce(function(result, next) {
            result.push(next.iata)
            return result;
        }, []);

        if (!result[airport.iata]) {
            result[airport.iata] = {
                countryCode: airport.countryCode.toLowerCase()
            };
        }

        result[airport.iata].wizzairName = airport.shortName;
        result[airport.iata].wizzairRoutes = routes;
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
