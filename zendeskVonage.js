const Vonage = require('@vonage/server-sdk');
var express = require('express');
var cors = require('cors');
var path = require('path');
require('dotenv').config();
const https = require('https')
	

const app = express();
app.use(express.json());
const port = 3000;


const Vonage_API_KEY = process.env.API_KEY;
const Vonage_API_SECRET = process.env.API_SECRET;

const vonage = new Vonage({
  apiKey: Vonage_API_KEY,
  apiSecret: Vonage_API_SECRET,
}, {debug: true});

const from = process.env.VONAGE_NUMBER;

const JWT=process.env.JWT;
const zendeskCredentials=process.env.ZENDESK_CREDENTIALS;
const zendeskDomain=process.env.ZENDESK_DOMAIN;

//Inbound messages webhook added in Vonage nexmo dashbaord creates a ticekt in Zendesk
app.post('/inboundMessage', (req, res) => {
	var ticket_title=req.body.text;
	var toNumber=req.body.from;
	createZendeskTicket(ticket_title, toNumber);
	 res.json(200);
});


//Send outbound message using Vonage Vonage APIs
function sendMessage(requesterNumber,message){
	
//channel could be set to 'sms' or 'whatsapp'
var channel="whatsapp";
	
const data = JSON.stringify({
    "from": from,
    "to": requesterNumber,
    "message_type": "text",
    "text": message,
	"channel": channel
})

const options = {
  hostname: 'api.nexmo.com',
  port: 443,
  path: '/v1/messages',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer '+JWT 
  }
}

const req = https.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`)

  res.on('data', d => {
    process.stdout.write(d)
  })
})

req.on('error', error => {
	console.log("error here");
  console.error(error)
})

req.write(data)
req.end()

}

//Zendesk ticket update webhook sends an outbound message back to the user
app.post('/getTicketUpdate', (req, res) => {
	var requesterNumber=req.body.requester_name;
	var zendeskComment=req.body.comment; 
	var message="Ticket "+req.body.ticket_title+" with reference number: "+req.body.ticket_id+
		" has been updated with the following comment: "+zendeskComment;
	sendMessage(requesterNumber,message);
	 res.json(200);
});


function createZendeskTicket(ticket_title, toNumber){

//below object ticket is only for demo purpose
const data = JSON.stringify({
  "ticket": {
    "comment": {
      "body": "The smoke is very colorful."
    },
    "priority": "urgent",
    "subject": ticket_title,
	  "requester":{
		  "name":toNumber
	  }
  }
})

const options = {
  hostname: zendeskDomain,
  port: 443,
  path: '/api/v2/tickets.json',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Basic '+zendeskCredentials
  }
}

const req = https.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`)

  res.on('data', d => {
    process.stdout.write(d)
  })
})

req.on('error', error => {
	console.log("error here");
  console.error(error)
})

req.write(data)
req.end()

}

app.listen(port, () => console.log(`Hello world app listening on port ${port}!`));
