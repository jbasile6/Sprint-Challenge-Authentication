require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/dbConfig');
const secret = process.env.JWT_SECRET;


const axios = require('axios');

const { authenticate } = require('../auth/authenticate');

module.exports = server => {
  server.post('/api/register', register);
  server.post('/api/login', login);
  server.get('/api/jokes', authenticate, getJokes);
};

function register(req, res) {
  // implement user registration
  let user = req.body;
  const hash = bcrypt.hashSync(user.password, 8);
  user.password = hash;

  db('users')
    .insert(user)
    .then(newUser => res.status(201).json(newUser))
    .catch(err => res.status(500).json(err));
}

function login(req, res) {
  // implement user login
  const { username, password } = req.body;

  db('users')
    .where({ username })
    .first()
    .then(saved => {
      if(saved && bcrypt.compareSync(password, saved.password)) {
        const token = generateToken(saved)

        res.status(200).json({
          message: `Welcome ${saved.username}!`,
          token,
        })
      } else {
        res.status(400).json({ message: 'Invalid username or password'})
      }
    })
    .catch(err => res.status(500).json(err));
}

function getJokes(req, res) {
  const requestOptions = {
    headers: { accept: 'application/json' },
  };

  axios
    .get('https://icanhazdadjoke.com/search', requestOptions)
    .then(response => {
      res.status(200).json(response.data.results);
    })
    .catch(err => {
      res.status(500).json({ message: 'Error Fetching Jokes', error: err });
    });
}



function generateToken(user) {
  const payload = {
    subject: user.id,
    username: user.username
  }
  const options = {
    expiresIn: '1d'
  }

  return jwt.sign(payload, secret, options)
}