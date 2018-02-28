'use strict'

const mongoose = require('mongoose')
mongoose.Promise = global.Promise

const todoSchema = mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String },
  created: { type: Date, default: Date.now },
  due: { type: Date },
  status: { type: Boolean, default: false },
  tag: { type: String, default: 'inbox' }
})

const notesSchema = mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  created: { type: Date, default: Date.now },
  pinned: { type: Boolean, default: false }
})

const Todo = mongoose.model('Todo', todoSchema)
const Note = mongoose.model('Note', notesSchema)

module.exports = { Todo, Note }
