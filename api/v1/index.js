var express = require('express')
  , api = express.Router()
  , request = require('request')
  , Url = require('url')
  , lsq = require('lsq')
  , consul 	= require('lsq-consul')({ host: process.env.CONSUL_HOST, port: process.env.CONSUL_PORT })
  , _ = require('underscore')
  , Promise = require('promise')
  , auth = require("basic-auth")
  , sq
  , config

updateList()

function updateList(){
	var watcher = consul.watch(consul.kv.get, { key: process.env.SERVICE_NAME })
	watcher.on('change', function(result) {
		 try {
			if (!result) throw new Error('configuration not present')
			config = JSON.parse(result.Value)
		}
		catch (e) {}
	})
	watcher.on('error', function(err) {
	  console.log('error:', err)
	})
}

api.get('/',function(req,res){
  res.send(req.headers.host)
})

api.post('/service/add/:service',function(req,res){
	basicAuth(req,res).then(function(){
		var json = req.body
		var service = req.params.service
		var status = 200

		if(!json.host || !json.port){
			json = { error:"missing host or port" }
			status = 422
		}

		if(!json.error && !service){
			json = { error:"missing service" }
			status = 422
		}

		if(status!=200){
			res.status(status)
	      return res.send(json)
		}

		if(_.isObject(json.config))
			consul.kv.set(service,JSON.stringify(json.config),function(err,result){
			})
		else
			consul.kv.get(service,function(err,config){
				if(!config) {
					consul.kv.set(service,"{}",function(err,result){})
				}
			})

		consul.agent.service.register({
	        name: service,
	        name: json.id || service,
	        port: json.port,
	        address:json.host,
	        check: {
	          http: Url.format({ protocol: 'http',
	                             hostname: json.host,
	                             port: json.port,
	                             pathname:'/health'
	                           }),
	          interval: '1s'
	    	}
		},function(err,result){
			if(err || !result) {
				status = 422 
				err = !err ? "missing service" : err
				result = {value:{error:err}}
			}
			res.send(result.Value)
		})
	})
})

api.post('/service/remove/:service',function(req,res){
	basicAuth(req,res).then(function(){
		var json = req.body
		var service = req.params.service
		var status = 200
	   	
		if(!json.error && !service){
			json = {error:"missing service"}
			status = 422
		}

		if(status!=200){
			res.status(status)
	      return res.send(json)
		}
		if(json.config == true)
			consul.kv.del(service,function(err,result){
				console.log("error on del key",service,err)
			})
		consul.agent.service.deregister(json.id || service,function(err,result){
			if(err || !result) {
				status = 422 
				err = !err ? "missing service" : err
				result = {value:{error:err}}
			}
			res.send(result.Value)
		})
	})
	
})

api.post('/service/config/:service',function(req,res){
	basicAuth(req,res).then(function(){

		var json = req.body
		var service = req.params.service
		var status = 200

		if(!json.error && !service){
			json = {error:"missing service"}
			status = 422
		}

		if(status!=200){
			res.status(status)
	      return res.send(json)
		}

		consul.kv.set(service,JSON.stringify(json),function(err,result){
			if(err || !result) {
				status = 422 
				err = !err ? "missing service" : err
				result = {value:{error:err}}
			}
			res.send(result.Value)
		})
	})

})

api.get('/service/config/:service',function(req,res){
	basicAuth(req,res).then(function(){
		var json = {}
		var service = req.params.service
		var status = 200

		if(!json.error && !service){
			json = {error:"missing service"}
			status = 422
		}

		if(status!=200){
			res.status(status)
	      return res.send(json)
		}

		consul.kv.get(service,function(err,config){

			if(err || !config) {
				status = 422 
				err = !err ? "missing config" : err
				config = {value:{error:err}}
			}
			
			res.status(status)
	      	res.send(config.Value)
		})
	})
})

api.get('/service/list',function(req,res){
	basicAuth(req,res).then(function(){
		lsq.services.list()
	  	.then(function(services){
	  		res.send(services || {})
	  	})
	})
})

api.get('/service/list/detail',function(req,res){
	basicAuth(req,res).then(function(){
		var promises = []
		lsq.services.list()
	  	.then(function(services){
			return services.map(function(service) { return detail(service)})
	    })
	    .then(Promise.all)
	    .then(function(results){
	    	res.send(results)
	    })
	})
})

function basicAuth(req,res){
	return new Promise(function(resolve,reject){
		if(!_.isObject(config.auth)) return resolve()
		
		var credentials = auth(req)
		if (credentials  
		&& _.has(config.auth,credentials.name)
		&& config.auth[credentials.name] == credentials.pass) 
			return resolve()

		res.writeHead(401, {
			'WWW-Authenticate': 'Basic realm="Auth"'
		})
		res.end()
		reject() 
	})
}

function detail(service){
	return new Promise(function(resolve, reject) {
		consul.catalog.service.nodes(service,function(err, services) {
		  if (err) return reject(err)
		  resolve(services)
		})
	})
}
module.exports = api

