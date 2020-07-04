<template>

  <div class='main'>
  <div v-for="(r) in reqs" :key="r.id">
    
    <b-alert class='req' variant="success" show >
        <b-row v-b-toggle="r.id"
        v-on:click="collapse_show(r)"
        >
      <b-col cols="1">
        <b-badge variant='success'>{{r.req.method}}</b-badge>
      </b-col>
            <b-col cols="2">
              <span>{{r.req.path}}</span>
            </b-col>
            <b-col>
              <span>{{r.req.userAgent}}</span>
            </b-col>
            
            <b-col class='text-right'>
              <div>{{r.time_ago}}</div>
              <div>{{r.ts}}</div>
            </b-col>
        </b-row>
        <b-row>
        <!-- <b-button v-b-toggle.collapse-1 variant="primary">Toggle Collapse</b-button> -->
      <b-collapse :id="r.id" class="mt-2">
        <b-card>
          <pre class='payload'>{{JSON.stringify(r,null,2)}}</pre>
          <pre class='payload' v-if="r.full">{{r.full}}</pre>
        </b-card>
      </b-collapse>
      </b-row>

    </b-alert>

    <!-- {{r.id}} -->
  </div>
    
  </div>

</template>
 
<script>
var moment = require('moment')
export default {
    name: 'microfrontend',
    data() {
      return {
        error: false,
        loading: false,
        reqs:[]
      }
    },
    mounted: function() {
      this.stub()
    },
    created: function() {
    },
    methods: {
      get_req:function(r){
        return new Promise((resolve,reject)=>{
          fetch(this.$api + '/integration/'+r.id, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': this.get_auth_header()
              },
              // body: JSON.stringify(d),
            })
            .then(res => res.json()) 
            .then(data => {
              resolve(data)
            })
          })
      },
      collapse_show: async function(e){
        console.log(e)
        // e.body='asdf'
        var res = await this.get_req(e)
        this.reqs[this.reqs.indexOf(e)].full = 'asdf'
        return res
      },
       stub: function(d) {
        return new Promise((resolve,reject)=>{
          fetch(this.$api + '/integrations', {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': this.get_auth_header()
              },
              // body: JSON.stringify(d),
            })
            .then(res => res.json()) 
            .then(data => {
              console.log(data)
              this.reqs=data.map(r=>{
                var ts  = moment.utc(r.d + ' ' + r.t, 'YYYY-MM-DD HH:mm:ss:SSSS' )
                r.time_ago = ts.fromNow()
                r.ts = ts.format('LLLL')
                return r
              })
              resolve(data)
            }).catch(e => {
              this.error = e; console.error('exception:', e);
            })
          })
      },
      },
  }
</script>

<style scoped>
.main {
  margin:20px  auto ;
  width:800px;
}
.req{
  cursor: pointer;
}
.payload{
    white-space: pre-wrap;
    width: -webkit-fill-available;
    width: 745px;
}

</style>
