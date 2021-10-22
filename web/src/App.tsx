import React, { useCallback, useEffect, useState } from 'react';

function useBluetoothDevice(options: RequestDeviceOptions = { acceptAllDevices: true }): [BluetoothDevice | undefined, () => void]  {
  const [device, setDevice] = useState<BluetoothDevice | undefined>(undefined)
  const requestDevice = useCallback(() => {
    async function doRequest() {
      const d = await navigator.bluetooth.requestDevice(options)
      setDevice(d)
    }
    doRequest()
  }, [setDevice, options])

  return [device, requestDevice]
}

function useBluetoothServer(device?: BluetoothDevice): BluetoothRemoteGATTServer | undefined  {
  const [server, setServer] = useState<BluetoothRemoteGATTServer | undefined>(undefined)

  useEffect(() => {
    async function doConnect() {
      if(device && device.gatt) {
        const server = await device.gatt.connect()
        setServer(server)
      } else {
        setServer(undefined)
      }
    }

    doConnect()
  }, [device, setServer])

  return server
}

export function App() {

  const [device, request] = useBluetoothDevice()
  const server = useBluetoothServer(device)

  console.log(device)
  console.log(server)

  return (
    <div>
      <h1>Web Bluetooth</h1>
      <button onClick={request}>Connect to Bluetooth</button>
      { device && <p>Device: {device.id}</p>}
      { server && <p>Server: {server.connected ? "Connnected" : "Disconnected"}</p>}
    </div>
  );
}

