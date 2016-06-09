const fetch = require("node-fetch");

function pad (val) {
	return (val < 10) ? ("0" + val) : val
}

module.exports = {
	fetch: function fetchRyanairFlights (airportFrom, airportTo, date) {
		const dateString = date.getUTCFullYear() + "-" + pad(date.getUTCMonth() + 1) + "-01";
		const url = "https://api.ryanair.com/farefinder/3/roundTripFares/" + airportFrom + "/" + airportTo +
			"/cheapestPerDay?inboundMonthOfDate=" + dateString + "&outboundMonthOfDate=" + dateString;
		return fetch(url)
			.then(function (response) {
				return response.json();
			})
			.then(function (response) {
				response.outbound.fares.forEach(function (flight) {
					flight.from = airportFrom;
					flight.to = airportTo;
				});
				response.inbound.fares.forEach(function (flight) {
					flight.from = airportTo;
					flight.to = airportFrom;
				});
				return {
					outbound: response.outbound.fares,
					inbound: response.inbound.fares
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
					date: new Date(flight.day)
				}
			})
	}
}
