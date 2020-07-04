'use strict'
const awsServerlessExpress = require(process.env.NODE_ENV === 'test' ? '../../index' : 'aws-serverless-express')
const app = require('./app')

// NOTE: If you get ERR_CONTENT_DECODING_FAILED in your browser, this is likely
// due to a compressed response (e.g. gzip) which has not been handled correctly
// by aws-serverless-express and/or API Gateway. Add the necessary MIME types to
// binaryMimeTypes below, then redeploy (`npm run package-deploy`)
const binaryMimeTypes = [
  'application/javascript',
  'application/json',
  'application/octet-stream',
  'application/xml',
  'font/eot',
  'font/opentype',
  'font/otf',
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'text/comma-separated-values',
  'text/css',
  'text/html',
  'text/javascript',
  'text/plain',
  'text/text',
  'text/xml'
]
const server = awsServerlessExpress.createServer(app, null, binaryMimeTypes)

exports.handler = (event, context) => {
  
  if(event.version == '2.0'){
    event.path = event.rawPath
    event.httpMethod = event.requestContext.http.method
  }
  // console.log(JSON.stringify(event,null,2))
  // console.log(JSON.stringify(context,null,2))
  return awsServerlessExpress.proxy(server, event, context)}
