// TODO support more airlines - EasyJet
// TODO support request cache

const ryanairHandler = require("./ryanairHandler");
const wizzAirHandler = require("./wizzAirHandler");

module.exports = function findFlights (body) {
	const airportsFrom = body.airportsFrom
	const airportsTo = body.airportsTo
	const minDate = new Date(body.minDate)
	const maxDate = new Date(body.maxDate)
	const allowedDaysThere = body.allowedDaysThere
	const allowedDaysBack = body.allowedDaysBack
	const spanInDaysMin = body.spanInDaysMin
	const spanInDaysMax = body.spanInDaysMax
	const currencyRatio = 1

	const dates = getDatesBetween(minDate, maxDate);
	return fetchAllFlights(airportsFrom, airportsTo, dates)
		.then(function (flights) {
			const ryanairFlights = mergeFlights(flights[0]).map(ryanairHandler.parse);
			const wizzAirFlights = mergeFlights(flights[1]).map(wizzAirHandler.parse);

			var flightsThere = ryanairFlights[0].concat(wizzAirFlights[0])
			flightsThere = filterFlights(flightsThere, minDate, maxDate, allowedDaysThere);

			var flightsBack = ryanairFlights[1].concat(wizzAirFlights[1]);
			flightsBack = filterFlights(flightsBack, minDate, maxDate, allowedDaysBack);

			const flightsPairs = [];
			flightsThere.forEach(function (flightThere) {
				flightsBack.forEach(function (flightBack) {
					const spanInDays = getSpanInDays(flightThere, flightBack)
					if (spanInDaysMax >= spanInDays && spanInDays >= spanInDaysMin) {
						flightsPairs.push({
							price: +((flightThere.price + (flightBack.price * currencyRatio)).toFixed(2)),
							spanInDays: spanInDays,
							there: flightThere,
							back: flightBack
						});
					}
				});
			});

			return {
				count: flightsPairs.length,
				flights: flightsPairs
					.sort(function (flights1, flights2) {
						return flights1.price - flights2.price;
					})
					.slice(0, 10)
			}
		})
}

function getDatesBetween (minDate, maxDate) {
	const dates = [];
	const date = new Date(minDate);
	date.setUTCDate(1);
	do {
		dates.push(new Date(date));
		date.setUTCMonth(date.getUTCMonth() + 1);
	} while (date <= maxDate)
	return dates;
}

function fetchAllFlights (airportsFrom, airportsTo, dates) {
	const ryanairFlightsFetches = [];
	const wizzAirFlightsFetches = [];
	airportsFrom.forEach(function (airportFrom) {
		airportsTo.forEach(function (airportTo) {
			dates.forEach(function (date) {
				var month = date.getUTCMonth() + 1;
				var year = date.getUTCFullYear();
				ryanairFlightsFetches.push(ryanairHandler.fetch(airportFrom, airportTo, month, year));
				wizzAirFlightsFetches.push(wizzAirHandler.fetch(airportFrom, airportTo, month, year));
			})
		})
	})

	return Promise.all([
			Promise.all(ryanairFlightsFetches),
			Promise.all(wizzAirFlightsFetches)
		]);
}

function mergeFlights (flights) {
	var outboundFlights = flights.reduce(function (result, next) {
		return result.concat(next.outbound);
	}, []);
	var inboundFlights = flights.reduce(function (result, next) {
		return result.concat(next.inbound);
	}, []);
	return [outboundFlights, inboundFlights]
}

function filterFlights (flights, minDate, maxDate, allowedDays) {
	return flights
		.filter(function (flight) {
			return (maxDate >= flight.date) && (flight.date >= minDate) && (allowedDays.indexOf(flight.date.getUTCDay()) >= 0);
		});
}

function getSpanInDays (flight1, flight2) {
	return (flight2.date.getTime() - flight1.date.getTime()) / (24 * 60 * 60 * 1000);
}
