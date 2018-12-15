import { URL } from 'url'

import * as shortid from 'shortid'
import { ipcMain, protocol } from 'electron'

import * as hiddenWindows from '../hidden-windows'

export function setup () {
  protocol.registerHttpProtocol('start-proxy', handler, err => {
    if (err) throw new Error('Failed to create protocol: start-proxy. ' + err)
  })
}

const portsByWindowId = {}
const serverIdsByPort = {}
const serverIdsByWindowId = {}

ipcMain.on('tcp-socket-proxy-server.ready', (event, windowId) => {
  event.sender.send('tcp-socket-proxy-server.init', serverIdsByWindowId[windowId], portsByWindowId[windowId])
})

ipcMain.on('tcp-socket-proxy.server', (event, windowId, serverId) => {
  serverIdsByPort[portsByWindowId[windowId]] = serverId
  serverIdsByWindowId[windowId] = serverId
})

const handler = async (request, callback) => {
  const { host: port } = new URL(request.url)

  let serverId = serverIdsByPort[port]
  if (serverId) {
    callback(serverId)
  } else {
    serverId = shortid.generate()
    const win = await createTunnelWindow()
    portsByWindowId[win.id] = port
    serverIdsByWindowId[win.id] = serverId
    callback(serverId)
  }
}

const createTunnelWindow = async () => {
  return await hiddenWindows.spawn('tcp-socket-proxy-server', './tcp-socket-proxy-server.js')
}
