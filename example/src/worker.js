import { Elm } from './Worker.elm?with=./WorkerCompanion.elm'

// Platform.worker on the main thread, sharing a bundle with Browser.element
const worker = Elm.Worker.init()
worker.ports.pong.subscribe((message) => {
  document.getElementById('fromMainThread').textContent = message
})
setInterval(() => worker.ports.ping.send('the main thread'), 200)

Elm.WorkerCompanion.init({ node: document.getElementById('companion') })

// Platform.worker in a Web Worker
const webWorker = new Worker(new URL('./webWorker.js', import.meta.url), { type: 'module' })
webWorker.addEventListener('message', (event) => {
  document.getElementById('fromWebWorker').textContent = event.data
})
webWorker.postMessage('a Web Worker')
