const shortid = require('shortid')
const { ipcRenderer, remote } = require('electron')

require('@microverse-network/node')

const Tracker = require('@microverse-network/tracker-plugin')
const WebRTCNegotiator = require('@microverse-network/webrtcnegotiator-plugin')
const Client = require('@microverse-network/tcp-socket-proxy/connect')

global.tracker = new Tracker()
global.webrtcnegotitator = new WebRTCNegotiator()

const win = remote.getCurrentWindow()

win.webContents.once('did-finish-load', () => {
  ipcRenderer.send('tcp-socket-proxy-client.ready', win.id)
})

ipcRenderer.once('tcp-socket-proxy-client.init', (event, id) => {
  global.module = new Client({ id })
  global.module.once('listening', () => {
    console.log(global.module.server.address())
    event.sender.send('tcp-socket-proxy.client', win.id, global.module.server.address())
  })
})
