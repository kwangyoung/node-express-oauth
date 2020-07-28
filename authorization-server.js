const fs = require("fs")
const express = require("express")
const bodyParser = require("body-parser")
const jwt = require("jsonwebtoken")
const {
	randomString,
	containsAll,
	decodeAuthCredentials,
	timeout,
} = require("./utils")

const config = {
	port: 9001,
	privateKey: fs.readFileSync("assets/private_key.pem"),

	clientId: "my-client",
	clientSecret: "zETqHgl0d7ThysUqPnaFuLOmG1E=",
	redirectUri: "http://localhost:9000/callback",

	authorizationEndpoint: "http://localhost:9001/authorize",
}

const clients = {
	"my-client": {
		name: "Sample Client",
		clientSecret: "zETqHgl0d7ThysUqPnaFuLOmG1E=",
		scopes: ["permission:name", "permission:date_of_birth"],
	},
	"test-client": {
		name: "Test Client",
		clientSecret: "TestSecret",
		scopes: ["permission:name"],
	},
}

const users = {
	user1: "password1",
	john: "appleseed",
}

const requests = {}
const authorizationCodes = {}

let state = ""

const app = express()
app.set("view engine", "ejs")
app.set("views", "assets/authorization-server")
app.use(timeout)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

/*
Your code here
*/
app.get("/authorize", (req, res) => {
	const clientId = req.query.client_id;
	const client = clients[clientId];
	if (!client) {
		return res.status(401).send("Error: client not authorized");
	}

	if (req.query.scope && !containsAll(client.scopes, req.query.scope.split(" "))) {
		return res.status(401).send("Error: invalid scopes requested");
	}

	const requestId = randomString();
	requests[requestId] = req.query;

	const params = {};
	params["client"] = client;
	params["scope"] = req.query.scope;
	params["requestId"] = requestId;

	res.render("login", params);
})

app.post("/approve", (req, res) => {
	const { userName, password, requestId } = req.body;

	if (!userName || users[userName] !== password) {
		return res.status(401).send("Error: user not authorized");
	}

	if (!requests[requestId]) {
		return res.status(401).send("Error: invalid user request");
	}

	const request = requests[requestId];
	delete requests[requestId];
	const code = randomString();
	authorizationCodes[code] = {
		"clientReq": request,
		"userName": userName
	};
	const redirectUri = request["redirect_uri"];
	const state = request["state"];
	const finalUri = new URL(redirectUri);
	finalUri.searchParams.append('code', code);
	finalUri.searchParams.append('state', state);
	res.redirect(finalUri);
})

app.post('/token', (req, res) => {
	const authToken = req.headers.authorization;
	if (!authToken) {
		return res.status(401).send("Error: not authorized");
	}

	const { clientId, clientSecret } = decodeAuthCredentials(authToken);

	if (!clients[clientId] || clients[clientId].clientSecret !== clientSecret) {
		return res.status(401).send("Error: client not authorized");
	}

	if (!req.body.code || !authorizationCodes[req.body.code]) {
		return res.status(401).send("Error: invalid code");
	}

	const obj = authorizationCodes[req.body.code];
	delete authorizationCodes[req.body.code];

	const accessToken = jwt.sign({ userName: obj.userName, scope: obj.clientReq.scope }, config.privateKey, { algorithm: 'RS256' });
	const returnJsonBody = {
		"access_token": accessToken,
		"token_type": "Bearer"
	};

	return res.status(200).json(returnJsonBody);
})

const server = app.listen(config.port, "localhost", function () {
	var host = server.address().address
	var port = server.address().port
})

// for testing purposes

module.exports = { app, requests, authorizationCodes, server }
