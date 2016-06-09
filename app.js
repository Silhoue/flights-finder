const express = require("express");
const bodyParser = require("body-parser");
const flightsFinder = require("./src/flightsFinder");

const port = 3000;

const app = express();

app.disable("x-powered-by")

app.use(express.static("src/public"));

app.use(bodyParser.json());

app.post("/", function(req, res) {
	flightsFinder(req.body)
		.then(function (results) {
			res.json(results);
		})
		.catch(function(error) {
			console.log(error.stack)
			res.status(500).send({ error: error.message });
		})
});

app.listen(port, function () {
	console.log("App listening on port " + port);
});
