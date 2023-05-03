const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');
const app = express();
const port = 3001;

const knex = require('knex')

const saltRounds = 10;

const smartbrain_db = knex({
    client: 'pg',
    
});

smartbrain_db.select('*').from('users').then(data => {
    console.log(data);
});
  

app.use(bodyParser.json()) // for parsing application/json
app.use(cors());



app.get('/', (req, res) => {
    res.json(database.users);
});

app.post('/signin', (req, res) => {
    smartbrain_db.select('email', 'hash').from('login')
        .where('email', '=', req.body.email)
        .then(data => {
            const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
            if (isValid) {
                return smartbrain_db.select('*').from('users')
                .where('email', '=', req.body.email)
                .then(user => {
                    res.json(user[0])
                })
                .catch(err => res.status(400).json("unable to get user."));
            } else {
                console.log(data);
                res.status(400).json("wrong credentials.");
            }
        })
        .catch(err => res.status(400).json("wrong credentials"));
});

app.post('/register', (req, res) => {
    const { email, name, password } = req.body;
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(password, salt);
    
    smartbrain_db.transaction(trx => {
        trx.insert({
            hash: hash,
            email: email 
        })
        .into('login')
        .returning('email')
        .then(loginEmail => {
            return trx('users')
            .returning('*')
            .insert({
                email: loginEmail[0]["email"],
                name: name,
                joined: new Date
            })
            .then(user => {
                res.json(user[0]);
            })
        })
        .then(trx.commit)
        .catch(trx.rollback);
    })
    .catch(err => res.status(400).json("Unable to register."));
    
    
});

app.get('/profile/:id', (req, res) => {
    const { id } = req.params;
    let found = false;
    smartbrain_db.select('*').from('users').where({
        id: id
    })
     .then(user => {
        if (user.length) {
            res.json(user[0]);
        } else {
            res.status(400).json("Not found");
        }
     })
     .catch(err => res.status(400).json("error getting user."))
});

app.put('/image', (res, req) => {
    const { id } = req.body;
    smartbrain_db('users').where('id', '=', id)
    .increment('entries', 1)
    .returning('entries')
    .then(entries => {
        res.json(entries[0])
    })
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});