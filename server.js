'use strict';
const express = require('express');
const app = express();

require('dotenv').config();

const cors = require('cors');
app.use(cors());

//identical code below
// --------------------
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

// this function comes directly from the jasonwebtoken docs
const client = jwksClient({
  // this url comes from your app on the auth0 dashboard
  jwksUri: 'https://miriamsilva.us.auth0.com/.well-known/jwks.json'
});

const PORT = process.env.PORT || 3001;

// this function comes directly from the jasonwebtoken docs
function getKey(header, callback){
  client.getSigningKey(header.kid, function(err, key) {
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

// ------------------------------

//MongoDB things

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/test', {useNewUrlParser: true, useUnifiedTopology: true});

//copied from mongoose quickstart
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('connected to mongoDB');
});

const bookSchema = new mongoose.Schema({
  name: String,
  description: String,
  status: Number,
  email: String
});

const Book = mongoose.model('Book', bookSchema);
//this will be in models folder above

//let CoolCatBook = new Book({
//  name: 'Cool Cats',
//  description: 'A book about the coolest cats',
//  status: 12,
//  email: 'jbrown6@alumni.berklee.edu'
//});
//saves the book into the DB
//CoolCatBook.save ((err, bookFromDB) => {
//  console.log('saved the book');
//  console.log(bookFromDB);
//});

//let HarryPotter = new Book({
//  name: 'Harry Potter',
//  description: 'wizards',
//  status: 112,
//  email: 'jbrown6@alumni.berklee.edu'
//});
//saves the book into the DB
//HarryPotter.save ((err, bookFromDB) => {
//  console.log('saved the book');
//  console.log(bookFromDB);
//});

//let Educated = new Book({
//  name: 'Educated',
//  description: 'Ultra orthodox mormon who is not allowed to go to school because the government is indoctrinating everyone.',
//  status: 201,
//  email: 'jbrown6@alumni.berklee.edu'
//});
//saves the book into the DB
//Educated.save ((err, bookFromDB) => {
//  console.log('saved the book');
//  console.log(bookFromDB);
//});

app.get('/all-books', (req, res) => {
  Book.find({}, (err, books) => {
    console.log(books);
    res.send(books);
  });
});

app.get('/books', (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  //make sure token was valid
  jwt.verify(token, getKey, {}, function(err, user) {
    if (err) {
      res.status(500).send('invalid token');
    }
    else {
      let userEmail = user.email;
      Book.find({email: userEmail}, (err, books) => {
        console.log(books);
        res.send(books);
      });
    }
  });
});


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
