const express = require("express");
var bodyParser = require('body-parser');

const port = 3000;

const app = express();
app.disable("x-powered-by")

app.use(bodyParser.json());

app.use(express.static("src/public"));

app.post("/", function(req, res) {
	console.log(req.body);
  	res.json({})
});

app.listen(port, function () {
  console.log("App listening on port " + port);
});
