'use strict';

require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

// this function comes directly from the jasonwebtoken docs
const client = jwksClient({
  // this url comes from your app on the auth0 dashboard 
  jwksUri: 'https://miriamsilva.us.auth0.com/.well-known/jwks.json'
});

app.use(cors());

const PORT = process.env.PORT || 3001;

// this function comes directly from the jasonwebtoken docs
function getKey(header, callback){
  client.getSigningKey(header.kid, function(err, key) {
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

app.get('/test-login', (req, res) => {
  // grab the token that was sent by the frontend
  const token = req.headers.authorization.split(' ')[1];
  // make sure the token was valid
  jwt.verify(token, getKey, {}, function(err, user) {
    if(err) {
      res.status(500).send('invalid token');
    } else {
      res.send(user);
    }
  });
});


app.listen(PORT, () => console.log(`listening on ${PORT}`));
