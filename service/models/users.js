var faker = require('faker')
var moment = require('moment')
var _ = require('lodash')
const dynamoose = require('dynamoose');
var slugify = require('slugify')

const Schema = dynamoose.Schema;
dynamoose.aws.sdk.config.update({
      region: 'us-east-1'
    });
    

var schema = new Schema({
    "id": {
        type: String,
        hashKey: true
    },
    name: String,
},{
    saveUnknown: true,
    useDocumentTypes: true,
    timestamps: true,
    throughput: 'ON_DEMAND',
    create:true, 
    update:true,
})
const Model = dynamoose.model('User', schema)



const index = function(){
    return new Promise( async (resolve, reject)=>{
        Model.scan().exec()
        .then(function(users) {
                return resolve(users)
            }) 
    }) 
} 


const get = function(id){
    console.log(id)
    return new Promise( async (resolve, reject)=>{
        Model.get(id)
        .then(function(m) {
            console.log(m)
                return resolve(m)
            })
    })
}

const create = function(m){
    return new Promise( async (resolve, reject)=>{
        var user = {
            id: slugify(m.name),
            name:m.name
        }
        user= new Model(user)
        user.save()
        .then(function(res) {
                return resolve(res)
            })
    })
}

const update = function(id, user){
    return new Promise( async (resolve, reject)=>{
        Model.update({id: id},{
            name:user.name
        })
        .then(function(res) {
                return resolve(res)
            })
    })
} 

const remove = function(id){
    return new Promise( async (resolve, reject)=>{
        Model.delete(id)
        .then(function(m) {
                logger.log(m)
                return resolve({'msg':"deleted"})
        })
    })
}


module.exports = {
    index,
    get,
    create,
    update,
    remove
}





