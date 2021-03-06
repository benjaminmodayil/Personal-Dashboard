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

function uniqArr(arr) {
  const trArr = arr.filter(e => {
    if (e.tag.trim() !== undefined || e.tag.trim() !== '') {
      return e.tag
    }
  })
  const vArr = trArr.map(e => e.tag)
  return arr.filter((_, i) => vArr.indexOf(vArr[i]) === i)
}

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
      .sort({ created: -1 })
      .then(items => {
        collector.todos = items
        app.locals.todos = () => items
        console.log('finding todos')
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
    res.status(200).json({
      todos: collector[0],
      notes: collector[1]
    })
  })
})

app.get('/', (req, res) => {
  Todo.find()
    .sort({ created: -1 })
    .then(items => {
      collector.todos = items
      app.locals.todos = () => items
      app.locals.tags = () => uniqArr(items)
      console.log('finding todos')
      return items
    })
    .then(items => {
      res.render('index', {
        title: 'Dashboard',
        section_title_1: 'Todos',
        section_title_2: 'Notes',
        todos: items
        // notes: collector.notes
      })
    })
    .catch(err => {
      console.error(err)
      res.status(500).json({ error: 'something went wrong' })
    })
})

app.get('/todos', (req, res) => {
  Todo.find()
    .sort({ created: -1 })
    .then(items => {
      collector.todos = items
      app.locals.todos = () => items
      console.log('finding todos')
      return items
    })
    .then(items => {
      res.status(200).json({
        todos: items
      })
    })
    .catch(err => {
      console.error(err)
      res.status(500).json({ error: 'something went wrong' })
    })
})

app.get('/todos/:id', (req, res) => {
  Todo.findById(`${req.params.id}`)
    .then(item => {
      res.status(200).json({
        todos: item
      })
    })
    .catch(err => {
      console.error(err)
      res.status(500).json({ error: 'something went wrong' })
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
      tag: req.body.tag,
      status: req.body.status
    })
      .then(todo => {
        console.log(todo)
        res.status(201)
        res.json(todo)
      })
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
    return
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
