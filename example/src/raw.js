import HelloInRaw from './Raw.elm?raw'

const meta = document.createElement('meta')
meta.name = 'elm:plugin'
meta.content = HelloInRaw.split('\n')[0]
document.head.appendChild(meta)
