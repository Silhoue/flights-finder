const express = require("express");
const port = 3000;

const app = express();

app.get('/', function(req, res) {
  res.send('hello world');
});

app.listen(port, function () {
  console.log("App listening on port " + port);
});
