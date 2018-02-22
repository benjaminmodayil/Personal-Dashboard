let todoList = document.querySelector('.list-todos')
let item = document.createElement('li')
item.innerHTML = `test`
todoList.appendChild(item)

let deleteItem = (url, data) => {
  let headers = {
    body: JSON.stringify(data),
    credentials: 'same-origin',
    headers: {
      'content-type': 'application/json'
    },
    method: 'DELETE'
  }
  return fetch(url, headers)
}

const deleteButton = document.querySelector('.list-todos__delete')

let deleteThis = e => {
  const listItem = e.currentTarget.parentNode
  deleteItem(`/todos/${listItem.dataset.id}`, { id: listItem.dataset.id }).then(() => {
    listItem.remove()
  })
}

deleteButton.addEventListener('click', deleteThis)
