// TODO print results to UI
// TODO suport more airlines - WizzAir, EasyJet

document.querySelector(".advanced-options-toggle").addEventListener("click", showAdvancedOptions);
document.querySelector("form").addEventListener("submit", findFlights);

function showAdvancedOptions (e) {
	e.currentTarget.className += " active";
}

function findFlights (e) {
	e.preventDefault();
	const formData = e.srcElement.elements;

	const airportsFrom = (formData.airportsFrom.value).split(/\W+/);
	const airportsTo = (formData.airportsTo.value).split(/\W+/);
	const minDate = formData.minDate.valueAsDate;
	const maxDate = formData.maxDate.valueAsDate;
	const allowedDaysThere = getAllowedDays(formData.allowedDaysThere.elements);
	const allowedDaysBack = getAllowedDays(formData.allowedDaysBack.elements);
	const spanInDaysMin = formData.spanInDaysMin.value;
	const spanInDaysMax = formData.spanInDaysMax.value;

	const dates = getDatesBetween(minDate, maxDate);
	fetchAllFlights(airportsFrom, airportsTo, dates)
		.then(mergeFlights)
		.then(function (flights) {
			var flightsThere = filterFlights(parseRyanairFlights(flights.outbound), minDate, maxDate, allowedDaysThere);
			var flightsBack = filterFlights(parseRyanairFlights(flights.inbound), minDate, maxDate, allowedDaysBack);

			var flightsPaired = [];
			flightsThere.forEach(function (flightThere) {
				flightsBack.forEach(function (flightBack) {
					var spanInDays = getSpanInDays(flightThere, flightBack)
					if (spanInDaysMax >= spanInDays && spanInDays >= spanInDaysMin) {
						flightsPaired.push({
							price: (flightThere.price + flightBack.price).toFixed(2),
							spanInDays: spanInDays,
							there: flightThere,
							back: flightBack
						});
					}
				});
			});

			if (!flightsPaired.length) {
				console.log("No flights found")
			} else {
				flightsPaired
					.sort(function (flights1, flights2) {
						return flights1.price - flights2.price;
					})
					.slice(0, 10)
					.forEach(function (flights) {
						console.log(
							flights.price + " " + flights.there.date.toDateString() + "-" + flights.back.date.toDateString() +
							" (" + flights.spanInDays + " days, " +
								flights.there.from + "-" + flights.there.to + " " + flights.there.price + flights.there.currency + " + " +
								flights.back.from + "-" + flights.back.to + " " + flights.back.price + flights.back.currency + ")"
						);
					});
			}
		});
}

function getAllowedDays (inputs) {
	var daysArray = [];
	for (var i in inputs) {
		inputs[i].checked && daysArray.push(Number(inputs[i].value))
	}
	return daysArray;
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

function getDateString (date) {
	return date.getUTCFullYear() + "-" + pad(date.getUTCMonth() + 1) + "-01";
}

function fetchRyanairFlights (airportFrom, airportTo, date) {
	const dateString = getDateString(date);
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
			return response;
		});
}

function mergeFlights (flights) {
	var outboundFlights = flights.reduce(function (prev, next) {
		return prev.concat(next.outbound.fares);
	}, []);
	var inboundFlights = flights.reduce(function (prev, next) {
		return prev.concat(next.inbound.fares);
	}, []);
	return {
		outbound: outboundFlights,
		inbound: inboundFlights
	}
}

function parseRyanairFlights (flights) {
	return flights
		.filter(function (flight) {
			return !flight.soldOut && !flight.unavailable;
		})
		.map(function (flight) {
			return {
				from: flight.from,
				to: flight.to,
				price: flight.price.value,
				currency: flight.price.currencyCode,
				date: new Date(flight.day)
			}
		})
}

function filterFlights (flights, minDate, maxDate, allowedDays) {
	return flights
		.filter(function (flight) {
			return (maxDate >= flight.date) && (flight.date >= minDate) && allowedDays.includes(flight.date.getDay());
		});
}

function getSpanInDays (flight1, flight2) {
	return (flight2.date.getTime() - flight1.date.getTime()) / (24 * 60 * 60 * 1000);
}