const results = document.querySelector(".results");
document.querySelector(".advanced-options-toggle").addEventListener("click", showAdvancedOptions);
document.querySelector("form").addEventListener("submit", findFlights);

function showAdvancedOptions (e) {
	e.currentTarget.className += " active";
}

function findFlights (e) {
	e.preventDefault();

	results.innerHTML = "Searching..."
	const formData = e.target.elements;

	fetch("/", {
		method: "POST",
		headers: {
      		"Content-Type": "application/json"
    	},
		body: JSON.stringify({
			airportsFrom: formData.airportsFrom.value.trim().split(/\W+/),
			airportsTo: formData.airportsTo.value.trim().split(/\W+/),
			minDate: formData.minDate.value,
			maxDate: formData.maxDate.value,
			allowedDaysThere: getAllowedDays(formData.allowedDaysThere.elements),
			allowedDaysBack: getAllowedDays(formData.allowedDaysBack.elements),
			spanInDaysMin: formData.spanInDaysMin.value,
			spanInDaysMax: formData.spanInDaysMax.value
		})
	})
	.then(function (response) {
		return response.json();
	})
	.then(function (response) {
		if (response.error) {
			results.innerHTML = "Error: " + response.error;
		} else if (response.count) {
			printResults(response.flights);
		} else {
			results.innerHTML = "No flights found";
		}
	})
	.catch(function (error) {
		results.innerHTML = error.message;
	})
}

function getAllowedDays (inputs) {
	var daysArray = [];
	for (var i in inputs) {
		inputs[i].checked && daysArray.push(+(inputs[i].value))
	}
	return daysArray;
}

function printResults(flightsPairs) {
	var innerHTML = "";
	flightsPairs.forEach(function (flightsPair) {
		innerHTML += getHTML(flightsPair);
	});
	results.innerHTML = innerHTML;
}

function getHTML(flightsPair) {
	const priceTotal = flightsPair.price + " " + flightsPair.there.currency;
	const priceThere = flightsPair.there.price + " " + flightsPair.there.currency;
	const priceBack = flightsPair.back.price + " " + flightsPair.back.currency;

	const dateThere = new Date(flightsPair.there.date);
	const dateBack = new Date(flightsPair.back.date);
	dateThere.setMinutes(dateThere.getMinutes() + dateThere.getTimezoneOffset());
	dateBack.setMinutes(dateBack.getMinutes() + dateBack.getTimezoneOffset());

	const hoursThere = flightsPair.there.hours.join(", ") || "unknown";
	const hoursBack = flightsPair.back.hours.join(", ") || "unknown";

	return "<li class=\"flight \">" +
			"<div class=\"flight-summary\">" + priceTotal + "<br/>" + flightsPair.spanInDays + " days</div>" +
			"<div class=\"flight-details\">" +
				"<div class=\"flight-details-there " + flightsPair.there.carrier + "\"" +
					" title=\"" + hoursThere + "\">" +
					flightsPair.there.from + "-" + flightsPair.there.to + ", " +
					dateThere.toDateString() + ", " + priceThere +
				"</div>" +
				"<div class=\"flight-details-back " + flightsPair.back.carrier + "\"" +
					" title=\"" + hoursBack + "\">" +
					flightsPair.back.from + "-" + flightsPair.back.to + ", " +
					dateBack.toDateString() + ", " + priceBack +
				"</div>" +
			"</div>" +
		"</li>"
}
