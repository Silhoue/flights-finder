const fetch = require("node-fetch");

module.exports = function findFlights (body) {
	console.log(body);
	const airportsFrom = body.airportsFrom
	const airportsTo = body.airportsTo
	const minDate = new Date(body.minDate)
	const maxDate = new Date(body.maxDate)
	const allowedDaysThere = body.allowedDaysThere
	const allowedDaysBack = body.allowedDaysBack
	const spanInDaysMin = body.spanInDaysMin
	const spanInDaysMax = body.spanInDaysMax

	const dates = getDatesBetween(minDate, maxDate);
	return fetchAllFlights(airportsFrom, airportsTo, dates)
		.then(mergeFlights)
		.then(function (flights) {
			const flightsThere = filterFlights(parseRyanairFlights(flights.outbound), minDate, maxDate, allowedDaysThere);
			const flightsBack = filterFlights(parseRyanairFlights(flights.inbound), minDate, maxDate, allowedDaysBack);

			var flightsPairs = [];
			flightsThere.forEach(function (flightThere) {
				flightsBack.forEach(function (flightBack) {
					var spanInDays = getSpanInDays(flightThere, flightBack)
					if (spanInDaysMax >= spanInDays && spanInDays >= spanInDaysMin) {
						flightsPairs.push({
							price: (flightThere.price + flightBack.price).toFixed(2),
							spanInDays: spanInDays,
							there: flightThere,
							back: flightBack
						});
					}
				});
			});

			if (!flightsPairs.length) {
				return {};
			}

			return flightsPairs
				.sort(function (flights1, flights2) {
					return flights1.price - flights2.price;
				})
				.slice(0, 2)
		})
}

function getDatesBetween (minDate, maxDate) {
	const dates = [];
	const date = new Date(minDate);
	do {
		dates.push(new Date(date));
		date.setUTCMonth(date.getUTCMonth() + 1);
	} while (date <= maxDate)
	return dates;
}

function fetchAllFlights (airportsFrom, airportsTo, dates) {
	const flightsFetches = [];
	airportsFrom.forEach(function (airportFrom) {
		airportsTo.forEach(function (airportTo) {
			dates.forEach(function (date) {
				flightsFetches.push(fetchRyanairFlights(airportFrom, airportTo, date));
			})
		})
	})

	return Promise.all(flightsFetches);
}

function pad (val) {
	return (val < 10) ? ("0" + val) : val
}

function fetchRyanairFlights (airportFrom, airportTo, date) {
	const dateString = date.getUTCFullYear() + "-" + pad(date.getUTCMonth() + 1) + "-01";
	const url = "https://api.ryanair.com/farefinder/3/roundTripFares/" + airportFrom + "/" + airportTo +
		"/cheapestPerDay?inboundMonthOfDate=" + dateString + "&outboundMonthOfDate=" + dateString;
	return fetch(url)
		.then(function (response) {
			return response.json();
		})
		.then(function (response) {
			response.outbound.fares.forEach(function (flight) {
				Object.assign(flight, {
					from: airportFrom,
					to: airportTo
				})
			});
			response.inbound.fares.forEach(function (flight) {
				Object.assign(flight, {
					from: airportTo,
					to: airportFrom
				})
			});
			return {
				outbound: response.outbound.fares,
				inbound: response.inbound.fares
			};
		});
}

function mergeFlights (flights) {
	var outboundFlights = flights.reduce(function (result, next) {
		return result.concat(next.outbound);
	}, []);
	var inboundFlights = flights.reduce(function (result, next) {
		return result.concat(next.inbound);
	}, []);
	return {
		outbound: outboundFlights,
		inbound: inboundFlights
	}
}

function parseRyanairFlights (flights) {
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
				originalDate: flight.day
			}
		})
}

function filterFlights (flights, minDate, maxDate, allowedDays) {
	return flights
		.filter(function (flight) {
			return (maxDate >= flight.date) && (flight.date >= minDate) && (allowedDays.indexOf(flight.date.getDay()) >= 0);
		});
}

function getSpanInDays (flight1, flight2) {
	return (flight2.date.getTime() - flight1.date.getTime()) / (24 * 60 * 60 * 1000);
}
