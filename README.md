Service Manager
===

- Apis
- Config

APIs
---
### POST: /api/v1/service/add/:service

Adds to service discovery 
and to secret store

Payload:
```json
{
  "host" : "127.0.0.1",
  "port": 1234,
  "id":"health.1"
  "config":{ //optional
    // your json conf
  }
}
```

Response Success:
Http Code 200

Response Error:
Http Code 422


### POST: /api/v1/service/remove/:service

Removes to service discovery 
and from secret store

Payload:
```json
{
  "id":"health.1"
}
```

Response Success:
Http Code 200

Response Error:
Http Code 422


### POST: /api/v1/service/config/:service

Update/Add to secret store

Payload:
```json
{
 // json config data
}
```

Response Success:
Http Code 200

Response Error:
Http Code 422

### GET: /api/v1/service/config/:service

Read from secret store

Response Success:
Http Code 200

Response Error:
Http Code 422


### GET: /api/v1/service/list

Read from secret store

Response Success:
Http Code 200
```json
[
  "health",
  "www"
 // array of service names
]
```

### GET: /api/v1/service/list/detail

Read from secret store with more details

Response Success:
Http Code 200
```json
[
  [
    {
      Node: "local",
      Address: "127.0.0.1",
      ServiceID: "email",
      ServiceName: "email",
      ServiceTags: null,
      ServiceAddress: "",
      ServicePort: 55395
    }
  ],
  [
    {
      Node: "local",
      Address: "127.0.0.1",
      ServiceID: "health",
      ServiceName: "health",
      ServiceTags: null,
      ServiceAddress: "",
      ServicePort: 55396
    }
  ]
]
```

Config
---

Go to the config tab and set it with 
You can add what ever auth to login with user as key and pass as value.
It will be open when deployed make sure to password protech after

```json
{
  "auth":{
    "user":"passward"
  }
}

```





