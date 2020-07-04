'use strict'
global.logger = require('tracer').console({
  format: '<{{title}}> (in {{file}}:{{line}}) {{message}}',
  error:
          '<{{title}}> (in {{file}}:{{line}}) {{message}}\nCall Stack:\n{{stack}}' // error format
});
const util = require('util');
const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const compression = require('compression')
const awsServerlessExpressMiddleware = require('aws-serverless-express/middleware')
const app = express()
const router = express.Router()
var AWSXRay = require('aws-xray-sdk');
app.use(AWSXRay.express.openSegment('HaWtf'));

var fs = require('fs');
const { notDeepEqual } = require('assert');

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

router.use(compression())
router.use(cors())
router.use(bodyParser.json())
router.use(bodyParser.urlencoded({ extended: true }))
router.use(awsServerlessExpressMiddleware.eventContext())




router.get('/', (req, res) => {
  res.setHeader("Content-Type","text/html");
  res.sendFile(`${__dirname}/public/index.html`)
})

router.get('/users', (req, res) => {
  console.log('hit')
  // console.log(req)
  res.json({
    asdf:'asf'
  })
})


router.get('/public/microfrontend.js*', async (req, res) => {
  var module_path = `${__dirname}/${req.path.slice(1)}`
  if(req.apiGateway){
    var umd_module = await fs.readFileSync(module_path)
    res.send(umd_module.toString().replace(/http:\/\/localhost:3000/g, 'https://'+req.apiGateway.event.headers.Host))
  }else{
    res.sendFile(module_path)
  }
});

router.get('/public/*', (req, res) => {
  res.sendFile(`${__dirname}/${req.path.slice(1)}`)
})


// The aws-serverless-express library creates a server and listens on a Unix
// Domain Socket for you, so you can remove the usual call to app.listen.
// app.listen(3000)
app.use('/api/', router)

// Integrator routes
app.use('/', async (req, res) => {
  console.log('method',req.method)
  console.log('headers',req.headers)
  console.log('body',req.body)
  console.log('query',req.query)
  console.log('headers', JSON.stringify(req.headers,null,2))
  console.log('body', JSON.stringify(req.body,null,2))
  console.log('query', JSON.stringify(req.query,null,2))
  var original_event_no_body = JSON.parse(decodeUriComponent(headers['x-apigateway-event']))
  console.log('original_event_no_body', JSON.stringify(original_event_no_body,null,2))

  console.log(util.inspect(req, { compact: true, depth: 5, breakLength: 80 }));

  // console.log('req', JSON.stringify(req,null,2))
  return res.status(200).send('OK')
})

app.use(AWSXRay.express.closeSegment());

module.exports = app




