'use strict'

var express = require('express')
var path = require('path')
var hbs = require('hbs')
var favicon = require('serve-favicon')
var logger = require('morgan')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')

const mongoose = require('mongoose')
mongoose.Promise = global.Promise

var index = require('./routes/index')
// var users = require('./routes/users');

const { DATABASE_URL, PORT } = require('./config')
const { Todo, Note } = require('./models')
var app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'hbs')
hbs.localsAsTemplateData(app)

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

// app.use('/', index)
// app.use('/users', users);

let collector = {}

let findTodos = new Promise(function(resolve, reject) {
  resolve(
    Todo.find()
      .then(items => {
        collector.todos = items
        app.locals.todos = () => items
        return items
      })
      .catch(err => {
        console.error(err)
        res.status(500).json({ error: 'something went wrong' })
      })
  )
  reject(err)
})

let findNotes = new Promise(function(resolve, reject) {
  resolve(
    Note.find()
      .then(items => {
        collector.notes = items
        app.locals.notes = () => items
        return items
      })
      .catch(err => {
        console.error(err)
        res.status(500).json({ error: 'something went wrong' })
      })
  )
  reject(err)
})

let taskLoad = new Promise(function(resolve) {
  findTodos
    .then(() => findNotes)
    .then(() => resolve(collector))
    .catch(err => console.log(err))
})

app.get('/api/everything', (req, res) => {
  Promise.all([findTodos, findNotes]).then(collector => {
    console.log(collector)
    res.status(200).json({
      todos: collector[0],
      notes: collector[1]
    })
  })
})

app.get('/', (req, res) => {
  res.render('index', {
    title: 'Dashboard',
    section_title_1: 'Todos',
    section_title_2: 'Notes',
    todos: collector.todos,
    notes: collector.notes
  })
})

app.post('/todos', (req, res) => {
  const requiredFields = ['title']

  for (let i = 0; i < requiredFields.length; i++) {
    const field = requiredFields[i]

    if (!(field in req.body)) {
      const message = `Missing required '${field}' in req.body`
      console.error(message)
      return res.status(400).send(message)
    }

    Todo.create({
      title: req.body.title,
      content: req.body.content,
      due: req.body.due,
      status: req.body.status
    })
      .then(todo => res.status(201).json(todo))
      .catch(err => {
        console.error(err)
        res.status(500).json({ error: 'Something went wrong.' })
      })
  }
})

app.delete('/todos/:id', (req, res) => {
  Todo.findByIdAndRemove(req.params.id)
    .then(() => {
      res.status(204).json({ message: 'success' })
    })
    .catch(err => {
      console.error(err)
      res.status(500).json({ error: 'Something went wrong. 😢' })
    })
})
app.put('/todos/:id', (req, res) => {
  if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    res.status(400).json({
      error: 'Request path id and request body id values must match.'
    })
  }

  const updated = {}
  const updateableFields = ['title', 'content', 'status', 'due']

  updateableFields.forEach(field => {
    if (field in req.body) {
      updated[field] = req.body[field]
    }
  })

  Todo.findByIdAndUpdate(req.params.id, { $set: updated }, { new: true })
    .then(updatedItem => res.status(204).end())
    .catch(err => res.status(500).json({ message: 'Something went wrong.' }))
})

app.use('*', function(req, res) {
  res.status(404).json({ message: 'Not Found' })
})

let server

function runServer(databaseUrl, port = PORT) {
  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
      if (err) {
        return reject(err)
      }
      server = app
        .listen(port, () => {
          console.log(`Your app is listening on port ${port}`)
          resolve()
        })
        .on('error', err => {
          mongoose.disconnect()
          reject(err)
        })
    })
  })
}

function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing server')
      server.close(err => {
        if (err) {
          return reject(err)
        }
        resolve()
      })
    })
  })
}

if (require.main === module) {
  runServer(DATABASE_URL).catch(err => console.error(err))
}

module.exports = { runServer, app, closeServer }
