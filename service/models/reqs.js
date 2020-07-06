var faker = require('faker')
const axios = require('axios');
var moment = require('moment')
var _ = require('lodash')
var sha1 = require('sha1')
const dynamoose = require('dynamoose');
// console.log(process.env.AWS_ACCESS_KEY_ID)
dynamoose.aws.sdk.config.update({
    // "accessKeyId": process.env.AWS_ACCESS_KEY_ID,
    // "secretAccessKey": process.env.AWS_SECRET_ACCESS_KEY,
    "region": "us-east-1"
});

const Schema = dynamoose.Schema;

var slugify = require('slugify');
 
var schema = new Schema({
        id: {
            type: String,
            hashKey: true
        },
        t: {
            type: String,
        },
        d: {
            type: String,
            index: { 
                global: true,
                rangeKey: 't',
                name: 'timeIndex',
                project: ['id','req'],
                // project: true, // ProjectionType: ALL
                throughput: 'ON_DEMAND'
            }
        }, 
        req:Object,
        req_body:String,
        // "contentId": {
        //     type: String,
        //     index: {
        //         global: true,
        //         name: 'contentIdIndex',
        //         project: true, // ProjectionType: ALL
        //         throughput: 'ON_DEMAND'
        //     }
        // }, 
        // query:Object,
        // url_params:String,
        // request_query_params: String,
        // method:String,
        // path:String,
        // request_headers: String,
        // request_body: String,
        // response_headers: String,
        // response_body: String,
    },{
        saveUnknown: true,
        useDocumentTypes: true,
        timestamps: true
    })
const Model = dynamoose.model('IntegratorRequests', schema,{
        expires: 30 * 24 * 60 * 60 * 1000,
        throughput: 'ON_DEMAND',
        // create:true, 
        // update:true,
})
    
// mocks for service + route + method
const index = function(serviceId, path, method){
    return new Promise( async (resolve, reject)=>{
        Model.query('serviceId').eq(serviceId)
        .and().where('path').eq(path)
        .filter("method").eq(method)
        .exec()
        .then(function(mocks) {
                return resolve(mocks)
            })
    }) 
} 

// mocks for just service
const service_index = function(serviceId){
    return new Promise( async (resolve, reject)=>{
        Model.query('serviceId').eq(serviceId).exec()
        .then(function(mocks) {
                return resolve(mocks)
            })
    }) 
} 

const query = async function(day=null){
        var day = moment().utc().format("YYYY-MM-DD");
        console.log(day)
        try{
            var res = await Model.query('d').eq(day).sort("descending").limit(20).using('timeIndex').exec()
            res = res.map(r=>{return r.original()})
            return res
        }catch(e){
            console.error(e)
        }    
    return 'asdf'
} 

const serve = function(req){
    return new Promise( async (resolve, reject)=>{
        var serviceId = decodeURIComponent(req.path.split('/')[1])
        var path = '/'+req.path.split('/').slice(2).join('/')
        var method = req.method.toLowerCase()
        var request_body = req.body
        
        var id = to_content_id([serviceId, path, method, req.query, request_body])
        logger.log(id)

        return Model.query('contentId').eq(id)
            .exec()
            .then(function(m) {
                logger.log(m)
                // no mocks found
                if(!m.length){
                    return resolve(false)
                }
                
                // the first mock .... should be better
                var mock = m[0].originalItem()
                try{
                    mock.response_headers = JSON.parse(mock.response_headers)
                }catch(e){
                    logger.error(e)
                    mock.response_headers = {}
                }

                return resolve(mock)
            })
    })
}

const get = async function(id){
    return new Promise( async (resolve, reject)=>{
        Model.get(id)
        .then(async function(m) {
                return resolve(m)
            })
    })
}
// {
//     "version": "2.0",
//     "routeKey": "ANY /{proxy+}",
//     "rawPath": "/user",
//     "rawQueryString": "",
//     "headers": {
//         "accept": "application/json, text/plain, */*",
//         "content-length": "44",
//         "content-type": "application/json;charset=utf-8",
//         "host": "integrator.coldlambda.com",
//         "user-agent": "axios/0.19.2",
//         "x-amzn-trace-id": "Root=1-5f00a7c1-e1564e0059ae6c96197cfc05",
//         "x-forwarded-for": "173.49.243.128",
//         "x-forwarded-port": "443",
//         "x-forwarded-proto": "https"
//     },
//     "requestContext": {
//         "accountId": "173028852725",
//         "apiId": "vljwz2a305",
//         "domainName": "integrator.coldlambda.com",
//         "domainPrefix": "integrator",
//         "http": {
//             "method": "POST",
//             "path": "/user",
//             "protocol": "HTTP/1.1",
//             "sourceIp": "173.49.243.128",
//             "userAgent": "axios/0.19.2"
//         },
//         "requestId": "PJ8mMgg1IAMEPFA=",
//         "routeKey": "ANY /{proxy+}",
//         "stage": "$default",
//         "time": "04/Jul/2020:16:01:05 +0000",
//         "timeEpoch": 1593878465104
//     },
//     "pathParameters": {
//         "proxy": "user"
//     },
//     "isBase64Encoded": false,
//     "path": "/user",
//     "httpMethod": "POST"
// }

const create = async function(req){
    return new Promise( async (resolve, reject)=>{
        var r = JSON.parse(decodeURIComponent(req.headers['x-apigateway-event']))
        delete r.headers['x-amzn-trace-id']
        delete r.headers['x-forwarded-for']
        delete r.headers['x-forwarded-pprt']
        delete r.headers['x-forwarded-proto']
        delete r.headers['user-agent']
        delete r.headers['host']
        var ts = moment().utc();
        var res = await axios.get('https://api.ipdata.co/'+r.requestContext.http.sourceIp+'?api-key=2364233ca1b16417174e2cefaea7eac7c797e2e113d96332c23d2c0d')
        var ip_source = JSON.stringify(res.data)

        var request = {
            ...r.requestContext.http,
            headers:r.headers,
            query_string: r.rawQueryString,
            source: ip_source
        }

        var doc = {
            id: r.requestContext.requestId,
            d: ts.format("YYYY-MM-DD"), 
            t: ts.format("HH:mm:ss:SSSS"),
            req:request,
            isBase64Encoded: r.isBase64Encoded,
            req_body:req.body ? JSON.stringify(req.body) : null,
            time: r.requestContext.time,
            timeEpoch: r.requestContext.timeEpoch,
        }
        doc = new Model(doc)

        doc.save()
        .then(function(res) {
                return resolve(res)
            })
    })
}

var to_content_id = function(m){
    var id = sha1(m.map((d)=>{
        if(typeof(d)=='undefined'){
            return ''
        }
        if(typeof(d)=='object' && !Object.keys(d).length){
            return ''
        }
        if(typeof(d)=='object'){
            const ordered = {};
            Object.keys(d).sort().forEach(function(key) {
            ordered[key] = d[key];
            });
            d=slugify(JSON.stringify(ordered))
            console.log(d)
        }
        d = d.toLowerCase()
        console.log('id_component',d)
        return d
    }).join(''))
    return id
}

const update = function(mockId, mock){
    return new Promise( async (resolve, reject)=>{
        console.log(mock)
        Model.update({id: mockId},{
            contentId: to_content_id([mock.serviceId, mock.path, mock.method, mock.query, mock.request_body]),
            query: mock.query,
            request_headers: mock.request_headers,
            request_query_params: mock.request_query_params,
            request_body: mock.request_body,
            response_headers: mock.response_headers,
            response_body: mock.response_body,
        })
        .then(function(services) {
                return resolve(services)
            })
    })
} 

const remove = function(mockId){
    return new Promise( async (resolve, reject)=>{
        Model.delete(mockId)
        .then(function(m) {
                logger.log(m)
                return resolve({'msg':"deleted"})
        })
    })
}

module.exports = {
    query,
    index,
    service_index,
    get,
    create,
    update,
    serve,
    remove
}

