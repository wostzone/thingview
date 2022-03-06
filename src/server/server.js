// thingview.js
// Launch express server on port 8443 to present the WoST thingview dashboard application
// Includes proxy for access to services to avoid the need for cross site scripting.
//
// Usage:
//  >  node ./bin/server.js &
//
const express = require('express');
const path = require('path');
const fs = require('fs')
// const request = require('request')
const https = require('https')
const { createProxyMiddleware } = require('http-proxy-middleware');

const port = 8443
const privateKey = fs.readFileSync('./certs/serverKey.pem')
const certificate = fs.readFileSync('./certs/serverCert.pem')
var credentials = {key: privateKey, cert:certificate}

// The ports must match those of the services. These are the default ports.
const authURL = "https://localhost:8881"
const dirURL = "https://localhost:8886"
const mqttURL = "https://localhost:8885" // websocket

const app = express();
const publicPath = __dirname
// const publicPath = path.join(__dirname, './dist');

console.log("dirname=%s, publicPath: %s", __dirname, publicPath)
app.use(express.static(publicPath));
// app.use(express.json());

// proxy auth requests to the auth service on this host
app.use('/auth', createProxyMiddleware({ target: authURL, changeOrigin: true, secure:false }));
app.use('/things', createProxyMiddleware({ target: dirURL, changeOrigin: true, secure:false }));
app.use('/mqtt', createProxyMiddleware({ 
  target: mqttURL, 
  changeOrigin: true, 
  secure:false,
  ws: true,
 }));

// or:
// https://stackoverflow.com/questions/7559862/no-response-using-express-proxy-route/20539239#20539239
// https://stackoverflow.com/questions/26121830/proxy-json-requests-with-node-express
// app.use("/auth", function(req, res){
//   req.pipe( 
//     request({
//       qs:req.query, 
//       uri: url,
//       json: true,
//     }))
//   .pipe(res)
// })

// for browserHistory:
// https://github.com/reactjs/react-router/blob/1.0.x/docs/guides/basics/Histories.md
app.get('/favicon*', function(req, resp) {
  resp.sendFile(path.resolve(publicPath, 'favicon.png'));
});
app.get('/', function(req, resp) {
  resp.sendFile(path.resolve(publicPath, 'index.html'));
});
// For Vue (and react) all requests lead to index.html
// app.get('*', function(req, resp) {
//   console.log(".get", req.path, req.body, req.headers )
//   // resp.sendFile(path.resolve(publicPath, 'index.html'));
//   let filePath = path.resolve(path.join(publicPath, req.path));
  
//   resp.sendFile(filePath);
// });

console.log("Service %s on port %s", publicPath, (process.env.PORT || port) )
let httpsServer = https.createServer(credentials,app)
httpsServer.listen(port)


