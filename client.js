const express = require("express")
const bodyParser = require("body-parser")
const axios = require("axios").default
const { randomString, timeout } = require("./utils")

const config = {
	port: 9000,

	clientId: "my-client",
	clientSecret: "zETqHgl0d7ThysUqPnaFuLOmG1E=",
	redirectUri: "http://localhost:9000/callback",

	authorizationEndpoint: "http://localhost:9001/authorize",
	tokenEndpoint: "http://localhost:9001/token",
	userInfoEndpoint: "http://localhost:9002/user-info",
}
let state = ""

const app = express()
app.set("view engine", "ejs")
app.set("views", "assets/client")
app.use(timeout)
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

/*
Your code here
*/
app.get('/authorize', (req, res) => {
	state = randomString();
	const finalUri = new URL(config.authorizationEndpoint);
	finalUri.searchParams.append('response_type', "code");
	finalUri.searchParams.append('client_id', config.clientId);
	finalUri.searchParams.append('client_secret', config.clientSecret);
	finalUri.searchParams.append('redirect_uri', config.redirectUri);
	finalUri.searchParams.append('scope', "permission:name permission:date_of_birth");
	finalUri.searchParams.append('state', state);
	res.redirect(finalUri);
})

app.get('/callback', (req, res) => {
	if (!req.query.state || req.query.state !== state) {
		return res.status(403).send("Error: state is not matched");
	}

	axios({
		method: 'POST',
		url: config.tokenEndpoint,
		auth: { username: config.clientId, password: config.clientSecret },
		data: { code: req.query.code }
	})
		.then(response => {
			return axios({
				method: 'GET',
				url: config.userInfoEndpoint,
				headers: { authorization: `bearer ${response.data.access_token}` }
			})
				.then(response => {
					res.render("welcome", { user: response.data });
				});
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
	getState() {
		return state
	},
	setState(s) {
		state = s
	},
}
