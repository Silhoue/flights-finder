const store = require("./store");

const ryanairAirportsUrl = "https://api.ryanair.com/aggregate/4/common?embedded=airports";
const wizzairAirportsUrl = "https://be.wizzair.com/5.1.2/Api/asset/map?languageCode=en-gb"
const filePath = __dirname + "/../data/airports.json";
const airportPrefix = /^airport:/;

store.fetchAndSave(ryanairAirportsUrl, wizzairAirportsUrl, mergeAirports, filePath);

function mergeAirports(response) {
    const ryanairAirports = response[0].airports;
    const wizzairAirports = response[1].cities;
    const result = {};

    ryanairAirports.forEach(function (airport) {
        const routes = [];

        airport.routes.forEach(function(route) {
            if (airportPrefix.test(route)) {
                routes.push(route.replace(airportPrefix, ""))
            }
        })

        result[airport.iataCode] = {
            country: airport.countryCode.toUpperCase(),
            ryanairName: airport.name,
            ryanairRoutes: routes
        };
    });

    wizzairAirports.forEach(function (airport) {
        const routes = [];

        airport.connections.forEach(function(connection) {
            routes.push(connection.iata)
        });

        if (!result[airport.iata]) {
            result[airport.iata] = {
                country: airport.countryCode
            };
        }

        result[airport.iata].wizzairName = airport.shortName;
        result[airport.iata].wizzairRoutes = routes;
    });

    return result;
}
