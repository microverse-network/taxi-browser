const { ipcRenderer, remote } = require('electron')

require('@microverse-network/node')

const Tracker = require('@microverse-network/tracker-plugin')
const WebRTCNegotiator = require('@microverse-network/webrtcnegotiator-plugin')
const Server = require('@microverse-network/tcp-socket-proxy')

global.tracker = new Tracker()
global.webrtcnegotitator = new WebRTCNegotiator()

const win = remote.getCurrentWindow()

win.webContents.once('did-finish-load', () => {
  ipcRenderer.send('tcp-socket-proxy-server.ready', win.id)
})

ipcRenderer.once('tcp-socket-proxy-server.init', (event, id, port) => {
  global.module = new Server({ id, port })
  global.module.once('ready', () => {
    console.log(global.module.id)
    event.sender.send('tcp-socket-proxy.server', win.id, global.module.id)
  })
})
