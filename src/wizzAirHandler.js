const fetch = require("node-fetch");

var cache = {};

function handleResponse (response) {
	return response.ok ? response.json() : [];
}

module.exports = {
	fetch: function fetchWizzAirFlights (airportFrom, airportTo, month, year) {
		const key = airportFrom + airportTo + month + year
		if (cache[key]) {
			return cache[key];
		}
		const urlBase = "https://cdn.static.wizzair.com/pl-PL/TimeTableAjax?year=" + year + "&month=" + month;
		return cache[key] = Promise.all([
				fetch(urlBase + "&departureIATA=" + airportFrom + "&arrivalIATA=" + airportTo).then(handleResponse),
				fetch(urlBase + "&departureIATA=" + airportTo + "&arrivalIATA=" + airportFrom).then(handleResponse)
			])
			.then(function (result) {
				return {
					outbound: result[0],
					inbound: result[1]
				};
			});
	},
	parse: function parseWizzAirFlights (flights) {
		return flights
			.filter(function (flight) {
				return flight.InMonth === "True" && flight.MinimumPrice;
			})
			.map(function (flight) {
				const price = flight.MinimumPrice.split(" ");
				var priceValue = +(price[0].replace(",", "."));
				return {
					carrier: "wizz-air",
					from: flight.DepartureStationCode,
					to: flight.ArrivalStationCode,
					price: priceValue,
					currency: price[1],
					date: new Date(flight.CurrentDate),
					hours: flight.Flights.map(function (flight) {
						return flight.STD + "-" + flight.STA
					})
				}
			})
	}
}
