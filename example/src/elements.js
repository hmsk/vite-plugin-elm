import { Elm } from './Description.elm?with=./AnotherDescription.elm'

Elm.Description.init({
  node: document.getElementById('description'),
  flags: 'This message is rendered by Description.elm.'
})

Elm.AnotherDescription.init({
  node: document.getElementById('anotherDescription'),
  flags: ''
})
