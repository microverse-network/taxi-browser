import { URL } from 'url'

import { ipcMain, protocol } from 'electron'

import * as hiddenWindows from '../hidden-windows'

export function setup () {
  protocol.registerHttpProtocol('xttp', handler, err => {
    if (err) throw new Error('Failed to create protocol: xttp. ' + err)
  })
}

const queue = {}
const serversByTunnelId = {}
const tunnelIdsByWindowId = {}

ipcMain.on('tcp-socket-proxy-client.ready', (event, windowId) => {
  const channelId = `tcp-socket-proxy.${windowId}`
  const tunnelId = tunnelIdsByWindowId[windowId]
  event.sender.send('tcp-socket-proxy-client.init', tunnelId)
})

ipcMain.on('tcp-socket-proxy.client', (event, windowId, server) => {
  serversByTunnelId[tunnelIdsByWindowId[windowId]] = server
  queue[tunnelIdsByWindowId[windowId]].forEach(handleRequest)
})

const handler = async (request, callback) => {
  const tunnelUrl = new URL(request.url)
  const tunnelId = tunnelUrl.host
  let server = serversByTunnelId[tunnelId]
  if (server) {
    handleRequest({request, callback})
  } else {
    const win = await createTunnelWindow(tunnelId)
    tunnelIdsByWindowId[win.id] = tunnelId
    queue[tunnelId] = [{ request, callback }]
  }
}

const handleRequest = ({request, callback}) => {
  const tunnelUrl = new URL(request.url)
  const { address, port } = serversByTunnelId[tunnelUrl.host]
  const url = `http://localhost:${port}/${tunnelUrl.pathname}`
  const { method } = request
  callback({ method, url })
}

const createTunnelWindow = async () => {
  return await hiddenWindows.spawn('tcp-socket-proxy-client', './tcp-socket-proxy-client.js')
}
