const axios = require('axios');
axios.defaults.adapter = require('axios/lib/adapters/http');

var _ = require('lodash')
var url = 'https://integrator.coldlambda.com'

describe('integration', () => {
    jest.setTimeout(5000);

    var res;

    test('make_requests', async () => {
        try{
            res = await axios.post(url+ '/user', {
                firstName: 'Fred',
                lastName: 'Flintstone'
            })
            console.log(res.status)
        }catch(e){
            console.error(e)
        }

        try{
            res = await axios.get(url+'/user', {
                params: {
                  ID: 12345
                },
                headers:{
                    Authorization:'Bearer 123'
                }
              })
            console.log(res.status)
        }catch(e){
            console.error(e)
        }
        

    });




});
