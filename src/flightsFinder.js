const fetch = require("node-fetch");

module.exports = function findFlights (body) {
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
		.then(function (flights) {
			const ryanairFlights = mergeFlights(flights[0]).map(parseRyanairFlights);
			const wizzAirFlights = mergeFlights(flights[1]).map(parseWizzAirFlights);

			const flightsThere = ryanairFlights[0].concat(wizzAirFlights[0])
			flightsThere = filterFlights(flightsThere, minDate, maxDate, allowedDaysThere);

			const flightsBack = ryanairFlights[1].concat(wizzAirFlights[1]);
			flightsBack = filterFlights(flightsBack, minDate, maxDate, allowedDaysBack);

			const flightsPairs = [];
			flightsThere.forEach(function (flightThere) {
				flightsBack.forEach(function (flightBack) {
					const spanInDays = getSpanInDays(flightThere, flightBack)
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
				ryanairFlightsFetches.push(fetchRyanairFlights(airportFrom, airportTo, date));
				wizzAirFlightsFetches.push(fetchWizzAirFlights(airportFrom, airportTo, date));
			})
		})
	})

	return Promise.all([
			Promise.all(ryanairFlightsFetches),
			Promise.all(wizzAirFlightsFetches)
		]);
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

function fetchWizzAirFlights (airportFrom, airportTo, date) {
	const urlBase = "https://cdn.static.wizzair.com/pl-PL/TimeTableAjax?year=" + date.getUTCFullYear() +
		"&month=" + (date.getUTCMonth() + 1);
	return Promise.all([
			fetch(urlBase + "&departureIATA=" + airportFrom + "&arrivalIATA=" + airportTo).then(function (response) {
			return response.ok ? response.json() : [];
		}),
			fetch(urlBase + "&departureIATA=" + airportTo + "&arrivalIATA=" + airportFrom).then(function (response) {
				return response.ok ? response.json() : [];
			})
		])
		.then(function (result) {
			return {
				outbound: result[0],
				inbound: result[1]
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
	return [outboundFlights, inboundFlights]
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

function parseWizzAirFlights (flights) {
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
				date: new Date(flight.CurrentDate)
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
