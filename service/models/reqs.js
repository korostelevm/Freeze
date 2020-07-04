var faker = require('faker')
var moment = require('moment')
var _ = require('lodash')
var sha1 = require('sha1')
const dynamoose = require('dynamoose');

const Schema = dynamoose.Schema;
dynamoose.AWS.config.update({
      region: 'us-east-1'
    });
var slugify = require('slugify')
 
var schema = new Schema({
        "id": {
            type: String,
            hashKey: true
        },
        "req_t": {
            type: String,
        },
        "request": Object,
        "req_d": {
            type: String,
            index: { 
                global: true,
                rangeKey:'t',
                name: 'time_index',
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
        timestamps: true,
        throughput: 'ON_DEMAND',
        create:true, 
        update:true,
    })
const Model = dynamoose.model('Mock', schema)
    
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

const query = function(m){
    return new Promise( async (resolve, reject)=>{
        return resolve(null)
    })
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

const get = function(mockId){
    console.log(mockId)
    return new Promise( async (resolve, reject)=>{
        Model.get(mockId)
        .then(function(m) {
            console.log(m)
                return resolve(m)
            })
    })
}
    
const create = function(r){
    return new Promise( async (resolve, reject)=>{
        var ts = moment().utc();
        var req = {
            id: [m.service.id, m.mock.name].map((d)=>{return slugify(d)}).join('/') + m.path +'['+r.method +']',
            req_d: ts.format("YYYY-MM-DD"),
            req_t: ts.format("HH:mm:ss:SSSS"),
        }
        req = new Model(req)
        
        // var mock = new Model({
        //     id,
        //     serviceId: m.serviceId,
        //     routeId: m.routeId,
        //     ...m.mock
        //     // mockId: '/recall',
        //     // Service: 'RememberWorkPattern',
        //     // method: 'POST',
        //     // requestHeaders: {
        //     //     'Authorization':'test',
        //     //     'Content-Type':'application/json'
        //     // },   
        //     // requestBody: JSON.stringify({
        //     //     '_datapoint':'datapointName'
        //     // }),
        //     // responseHeaders: { 
        //     //     'Content-Type':'application/json' 
        //     // },
        //     // responseBody: JSON.stringify({
        //     //     'status':'saved' 
        //     })
            
        // // })
        // // mock_definition.mockId = [mock_definition.Service, mock_definition.path].join('')
        // // mock_definition = _.mapValues(mock_definition, (v)=>{
        // //     if(typeof(v)=='object'){return JSON.stringify(v)}
        // //     return v
        // //   })
        // //   var mock = new Model(mock_definition)
        // console.log(mock)

        req.save()
        .then(function(reqs) {
                return resolve(reqs)
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

