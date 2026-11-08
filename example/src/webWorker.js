import { Elm } from './Worker.elm'

const worker = Elm.Worker.init()
worker.ports.pong.subscribe((message) => postMessage(message))
addEventListener('message', (event) => worker.ports.ping.send(event.data))
