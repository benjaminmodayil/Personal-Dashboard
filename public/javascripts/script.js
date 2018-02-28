const todoList = document.querySelector('.list-todos')

const deleteButtons = document.querySelectorAll('.list-todos__delete')
const todoForm = document.querySelector('.todo-form')
const todoTitles = document.querySelectorAll('.list-todos__title')
const todoContents = document.querySelectorAll('.list-todos__content')

let todoTemplate = (identification, title, content) => {
  let todoBody, todoTemplate, todoTitle, todoDelete, directions, detail

  todoBody = document.createElement('li')
  todoBody.dataset.id = identification

  directions = content.length > 0 ? content : ``

  todoTemplate = `
    <details data-state="closed">
      <summary>
        <input type="checkbox">
        <span class="list-todos__title font-sans m-left-16">${title}</span>
      </summary>
      <div class="list-todos__content clearfix">
        <p class="p-left-32 font-serif f-s-14">
            ${directions}
        </p>

        <div class="todos__hidden-controls float-right">
          <button class="list-todos__delete">❌</button>
          <button class="list-todos__tags">🏷️</button>
          <button class="list-todos__date">📆</button>
        </div>
      </div>
    </details>
  `
  todoBody.innerHTML = todoTemplate

  todoList.prepend(todoBody)
  todoTitle = todoBody.querySelector('.list-todos__title')
  todoDelete = todoBody.querySelector('.list-todos__delete')
  detail = todoBody.querySelector('details')
  todoDelete.addEventListener('click', deleteThis)
  detail.addEventListener('click', e => e.preventDefault())
  detail.addEventListener('dblclick', detailClick)
}

let fetchItem = (url, data, meth = 'GET') => {
  let headers = {
    body: JSON.stringify(data),
    credentials: 'same-origin',
    headers: {
      'content-type': 'application/json'
    },
    method: `${meth.toUpperCase()}`
  }

  return fetch(url, headers)
}

let deleteThis = e => {
  const listItem = e.currentTarget.closest('li')
  fetchItem(`/todos/${listItem.dataset.id}`, { id: listItem.dataset.id }, 'DELETE').then(
    () => {
      console.log(`Removing ${listItem.dataset.id}`)
      listItem.remove()
    }
  )
}

let addThis = e => {
  e.preventDefault()
  let title = todoForm.querySelector('#todo-title').value.trim() || ''
  let content = todoForm.querySelector('#todo-description').value.trim() || ''
  let tag = todoForm.querySelector('#todo-tag').value.trim()
  // let due
  // let status
  // tag
  fetchItem(`/todos`, { title, content, tag }, 'POST')
    .then(item => {
      clearForm(todoForm)
      return item
    })
    .then(item => {
      console.log(item)
      fetchLatest()
    })
}

let fetchLatest = () => {
  fetch('/todos').then(response => {
    response.text().then(text => {
      let { todos } = JSON.parse(text)
      console.log(todos[0])
      let { _id, title, content } = todos[0]
      todoTemplate(_id, title, content)
    })
  })
}

let clearForm = node => {
  let inputs = node.querySelectorAll('input, select, textarea')
  inputs.forEach(i => (i.value = ''))
}

let replaceForm = (title, content) => {
  let titleToReplace = document.querySelector('.todo-title--editable')
  let contentToReplace = document.querySelector('.todo-content--editable')
  let todoTitle = document.createElement('span')
  todoTitle.classList.add('list-todos__title')
  todoTitle.innerHTML = `${title}`
  if (titleToReplace !== null) {
    titleToReplace.replaceWith(todoTitle)
    contentToReplace.innerHTML = `<p>${content}</p>`
  }
}

let IDTEST
let getID = item => {
  console.log(item.closest('li').dataset.id)
  return item.closest('li').dataset.id
}

let updateDB = identification => {
  let listItem = document.querySelector(`[data-id='${identification}']`)
  console.log(listItem)
  let editableTitle = listItem.querySelector(`#todo-title--update`)
  let editableContent = listItem.querySelector(`#todo-content--update`)
  const title = editableTitle.value || ''
  const content = editableContent.value || ''
  const id = editableTitle.closest('li').dataset.id
  console.log('update input ran')
  let editableTitles = listItem.querySelectorAll('#todo-title--update')
  if (editableTitles.length > 1) {
    console.log('ISSUE')
  }
  fetchItem(
    `/todos/${id}`,
    {
      id,
      title,
      content
    },
    'PUT'
  ).then(() => {
    // separate the replacing of items to a new function to be called here on submission, and on close
    // it should update on form submission* or closing of todo// OR // just update when closed and make ENTER close the todo// THE SECOND OPTION IS FAVORABLE
  })
  replaceForm(title, content)
}

let editableInputs = target => {
  let title = target.querySelector('.list-todos__title')
  let content = target.querySelector('.list-todos__content p')
  let titleText = title.textContent
  let contentText = content.textContent

  console.log(contentText)

  let titleItem
  titleItem = `
    <form method="POST" class="todo-title--editable">
      <label for="todo-title" class="screenreader-only">Title</label>
      <input type="text" id="todo-title--update" name="Todo Entry" value="${titleText.trim()}">
      <button class="screenreader-only"type="submit">update</button>
    </form>
  `

  let contentItem
  contentItem = `
    <form method="POST" class="todo-content--editable">
      <label for="todo-content" class="screenreader-only">Description</label>
      <input type="text" id="todo-content--update" name="Todo Description Entry" value="${contentText.trim()}">
      <button class="screenreader-only">update</button>
    </form>
  `

  title.innerHTML = titleItem
  content.innerHTML = contentItem
}

let newTodo = document.querySelector('.todo-new')

let showTodoForm = () => {
  let formContainer = document.querySelector('.form-container').classList

  if (formContainer.contains('--gone')) {
    formContainer.add('--forwards')
    formContainer.remove('--reverse')
    setTimeout(() => {
      formContainer.add('--present')
      formContainer.remove('--gone')
    }, 300)
  } else {
    formContainer.add('--reverse')
    formContainer.add('--gone')

    setTimeout(() => {
      formContainer.remove('--forwards')
      formContainer.remove('--present')
    }, 300)
  }
}

newTodo.addEventListener('click', showTodoForm)

const details = document.querySelectorAll('details')

let ariaDetails = e => {
  e.preventDefault()
  const detailPar = e.currentTarget

  detailPar.open
    ? detailPar.setAttribute('aria-expanded', 'true')
    : detailPar.setAttribute('aria-expanded', 'false')
}

// let closeAll = evt => {
//   details.forEach(item => {
//     let itemID = item.closest('li').dataset.id
//     let evtID = evt.currentTarget.closest('li').dataset.id

//     if (itemID !== evtID && item.open) {
//       // technically both are alike...
//       closeDetail(evt)
//     }
//   })
// }

// separate updating functionality to three functions
// 1. Set 1
// - open detail
//   - make title and content into forms
// 2.
//    Close input (e) 👇
//   - normal text
//   - dbUpdatedText

let detailClick = e => {
  if (e.currentTarget.dataset.state === 'open') {
    closeDetail(e.currentTarget)
    console.log('if 🏃')
  } else {
    openDetail(e)

    editableInputs(e.currentTarget)
  }

  // ariaDetails(e)
}

let openDetail = e => {
  let openedItem = document.querySelector('[data-state="open"]')

  if (openedItem) {
    closeDetail(openedItem)
    // openedItem.open = false
    // openedItem.dataset.state = 'closed'
  } else {
    console.log('no opened item')
  }
  e.currentTarget.dataset.state = 'open'
  e.currentTarget.open = true
}

let closeDetail = item => {
  console.log('closeDetail')
  updateDB(getID(item))
  item.open = false
  item.dataset.state = 'closed'
  // issue 👇
  // updateDB(getID(evt))
  // needs to run just before an item is closed as CLOSEDETAIL updates based on the evt param on the newly clicked detail
  item.setAttribute('aria-expanded', 'false')
}

let triggerDetail = e => {
  // getID(e)
  // closeAll(e)
  detailClick(e)
}

details.forEach(item => {
  item.addEventListener('click', e => e.preventDefault())
  item.addEventListener('dblclick', triggerDetail)
})

todoForm.addEventListener('submit', addThis)
deleteButtons.forEach(i => i.addEventListener('click', deleteThis))
