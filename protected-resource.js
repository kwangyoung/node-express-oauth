const express = require("express")
const bodyParser = require("body-parser")
const fs = require("fs")
const { timeout } = require("./utils")
const jwt = require("jsonwebtoken")

const config = {
	port: 9002,
	publicKey: fs.readFileSync("assets/public_key.pem"),
}

const users = {
	user1: {
		username: "user1",
		name: "User 1",
		date_of_birth: "7th October 1990",
		weight: 57,
	},
	john: {
		username: "john",
		name: "John Appleseed",
		date_of_birth: "12th September 1998",
		weight: 87,
	},
}

const app = express()
app.use(timeout)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

/*
Your code here
*/
app.get('/user-info', (req, res) => {
	const authToken = req.headers.authorization;
	if (!authToken) {
		return res.status(401).send("Error: No Authorization Token");
	}

	const payload = authToken.slice("bearer ".length);
	jwt.verify(payload, config.publicKey, { algorithms: ["RS256"] }, (err, decoded) => {
		if (err) {
			return res.status(401).send("Error: Authorization Token verification fails");
		}
		const { userName, scope } = decoded;
		const scopes = scope.split(" ");
		let jsonToReturn = {};
		for (let i = 0; i < scopes.length; i++) {
			let key = scopes[i].slice("permission:".length);
			jsonToReturn[key] = users[userName][key];
		}
		return res.json(jsonToReturn);
	});
})

const server = app.listen(config.port, "localhost", function () {
	var host = server.address().address
	var port = server.address().port
})

// for testing purposes
module.exports = {
	app,
	server,
}
