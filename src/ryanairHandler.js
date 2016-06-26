const fetch = require("node-fetch");

var cache = {};

function pad (val) {
	return (val < 10) ? ("0" + val) : val
}

module.exports = {
	fetch: function fetchRyanairFlights (airportFrom, airportTo, month, year) {
		const key = airportFrom + airportTo + month + year
		if (cache[key]) {
			return cache[key];
		}
		const dateString = year + "-" + pad(month) + "-01";
		const urlThere = "https://api.ryanair.com/farefinder/3/oneWayFares/" + airportFrom + "/" + airportTo +
			"/cheapestPerDay?&outboundMonthOfDate=" + dateString;
		const urlBack = "https://api.ryanair.com/farefinder/3/oneWayFares/" + airportTo + "/" + airportFrom +
			"/cheapestPerDay?&outboundMonthOfDate=" + dateString;
		return cache[key] = Promise.all([
				fetch(urlThere)
					.then(function (response) {
						return response.json();
					})
					.then(function (response) {
						response.outbound.fares.forEach(function (flight) {
							flight.from = airportFrom;
							flight.to = airportTo;
						})
						return response.outbound.fares;
					}),
				fetch(urlBack)
					.then(function (response) {
						return response.json();
					})
					.then(function (response) {
						response.outbound.fares.forEach(function (flight) {
							flight.from = airportTo;
							flight.to = airportFrom;
						})
						return response.outbound.fares;
					}),
			])
			.then(function (result) {
				return {
					outbound: result[0],
					inbound: result[1]
				};
			});
	},
	parse: function parseRyanairFlights (flights) {
		return flights
			.filter(function (flight) {
				return flight.price && !flight.soldOut && !flight.unavailable;
			})
			.map(function (flight) {
				return {
					carrier: "ryanair",
					from: flight.from,
					to: flight.to,
					price: flight.price.value,
					currency: flight.price.currencySymbol,
					date: new Date(flight.day),
					hours: []
				}
			})
	}
}
