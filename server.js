'use strict';
const express = require ('express');
const app = express ();

require ('dotenv').config ();

const cors = require ('cors');
app.use (cors ());

app.use (express.json ());

//identical code below
// --------------------
const jwt = require ('jsonwebtoken');
const jwksClient = require ('jwks-rsa');

// this function comes directly from the jasonwebtoken docs
const client = jwksClient ({
  // this url comes from your app on the auth0 dashboard
  jwksUri: 'https://miriamsilva.us.auth0.com/.well-known/jwks.json',
});

const PORT = process.env.PORT || 3001;

// this function comes directly from the jasonwebtoken docs
function getKey (header, callback) {
  client.getSigningKey (header.kid, function (err, key) {
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback (null, signingKey);
  });
}

// ------------------------------
//MongoDB things

const mongoose = require ('mongoose');
mongoose.connect (process.env.DATABASE_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//copied from mongoose quickstart
const db = mongoose.connection;
db.on ('error', console.error.bind (console, 'connection error:'));
db.once ('open', function () {
  console.log ('connected to mongoDB');
});

const bookSchema = new mongoose.Schema ({
  name: String,
  description: String,
  status: Number,
  email: String,
});

const Book = mongoose.model ('Book', bookSchema);
// //this will be in models folder above

app.get ('/test-login', (req, res) => {
  // grab the token that was sent by the frontend
  const token = req.headers.authorization.split (' ')[1];
  // make sure the token was valid
  jwt.verify (token, getKey, {}, function (err, user) {
    if (err) {
      res.status (500).send ('invalid token');
    } else {
      res.send (user);
    }
  });
});

app.get ('/all-books', (req, res) => {
  Book.find ({}, (err, books) => {
    console.log (books);
    res.send (books);
  });
});

//get books
app.get ('/books', (req, res) => {
  const token = req.headers.authorization.split (' ')[1];
  //make sure token was valid
  jwt.verify (token, getKey, {}, function (err, user) {
    if (err) {
      res.status (500).send ('invalid token');
    } else {
      let userEmail = user.email;
      Book.find ({email: userEmail}, (err, books) => {
        console.log (books);
        res.send (books);
      });
    }
  });
});

//post new books
app.post ('/books', (req, res) => {
  const token = req.headers.authorization.split (' ')[1];
  jwt.verify (token, getKey, {}, function (err, user) {
    if (err) {
      res.status (500).send ('invalid token');
    } else {
      console.log (req.body);
      const newBook = new Book ({
        name: req.body.name,
        description: req.body.description,
        status: req.body.status,
        email: user.email,
      });
      newBook.save ((err, savedBookData) => {
        res.send (savedBookData);
      });
    }
  });
});

//delete books by id
app.delete ('/books/:id', (req, res) => {
  console.log('delete', req.headers.authorization);
  const token = req.headers.authorization.split (' ')[1];
  jwt.verify (token, getKey, {}, function (err, user) {
    if (err) {
      res.status (500).send ('invalid token');
    } else {
      let bookId = req.params.id;
      Book.deleteOne ({
        _id: bookId,
        email: user.email,
      }).then (deletedBookData => {
        console.log (deletedBookData);
        res.send ('Your book has been deleted');
      });
    }
  });
});

//update book
app.put ('/books/:id', (req, res) => {
  const token = req.headers.authorization.split (' ')[1];
  jwt.verify (token, getKey, {}, function (err, user) {
    if (err) {
      res.status (500).send ('invalid token');
    } else {
      //find the book by id
      Book.findOne({
        _id: req.params.id,
        email: user.email,
      }).then(foundBook => {
        //update
        foundBook.name = req.body.name;
        foundBook.description = req.body.description;
        foundBook.status = req.body.status;
        //send back updated book to client
        foundBook.save().then(savedBook => res.send(savedBook));
      });
    }
  });
});

app.listen (PORT, () => console.log (`listening on ${PORT}`));
