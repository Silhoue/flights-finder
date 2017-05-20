const store = require("./store");

const ryanairCountriesUrl = "https://api.ryanair.com/aggregate/4/common?embedded=countries";
const wizzairCountriesUrl = "https://be.wizzair.com/5.1.2/Api/asset/country?languageCode=en-gb"
const filePath = __dirname + "/../data/countries.json";

store.fetchAndSave(ryanairCountriesUrl, wizzairCountriesUrl, mergeCountries, filePath);

function mergeCountries(response) {
    const ryanairCountries = response[0].countries;
    const wizzairCountries = response[1].countries;
    const result = {};

    ryanairCountries.forEach(function(next) {
        result[next.code.toUpperCase()] = next.name;
    })
    wizzairCountries.forEach(function(next) {
        if (result[next.code] && result[next.code] !== next.name) {
            console.log("Name conflict: overwritten" + result[next.code] + " with " + next.name)
        }
        result[next.code] = next.name;
    })

    return result;
}
