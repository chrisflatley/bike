import React, { useCallback, useEffect, useState } from 'react';

function useBluetoothDevice(options: RequestDeviceOptions = { acceptAllDevices: true }): [BluetoothDevice | undefined, () => void]  {
  const [device, setDevice] = useState<BluetoothDevice | undefined>(undefined)
  const requestDevice = useCallback(() => {
    async function doRequest() {
      const d = await navigator.bluetooth.requestDevice(options)
      setDevice(d)

      // TODO: How can we deal with this nicely?
      //   device.addEventListener('gattserverdisconnected', onDisconnected);

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

function useBluetoothServices(server: BluetoothRemoteGATTServer | undefined): BluetoothRemoteGATTService[]   {
  const [services, setServices] = useState<BluetoothRemoteGATTService[]>([])

  useEffect(() => {
    async function doConnect() {
      if(server) {
        const s = await server.getPrimaryServices()
        console.log(s)
        setServices(s)
      } else {
        setServices([])
      }
    }

    doConnect()
  }, [server, setServices])

  return services
}

function useBluetoothService(server: BluetoothRemoteGATTServer | undefined, service: BluetoothServiceUUID): BluetoothRemoteGATTService | undefined  {
  const [serviceValue, setService] = useState<BluetoothRemoteGATTService | undefined>(undefined)

  useEffect(() => {
    async function doConnect() {
      if(server && service) {
        const s = await server.getPrimaryService(service)
        setService(s)
      } else {
        setService(undefined)
      }
    }

    doConnect()
  }, [server, service, setService])

  return serviceValue
}

function useBluetoothServiceCharacteristics(service: BluetoothRemoteGATTService | undefined): BluetoothRemoteGATTCharacteristic[]  {
  const [characteristics, setCharacteristics] = useState<BluetoothRemoteGATTCharacteristic[]>([])

  useEffect(() => {
    async function doNotify() {
      if(service) {
        const c = await service.getCharacteristics()
        setCharacteristics(c)
      } else {
        setCharacteristics([])
      }
    }

    doNotify()
  }, [service, setCharacteristics])


  return characteristics
}

function useBluetoothCharacteristicValue<T>(service: BluetoothRemoteGATTService | undefined,  characteristic: string): T | undefined  {
  const [value, setValue] = useState<T | undefined>(undefined)

  useEffect(() => {
    async function onValueChanged(event: Event) {
      console.log(event.target)
    }

    async function doNotify() {
      if(service) {
        const c = await service.getCharacteristic(characteristic)
        if(c) {
          c.addEventListener('characteristicvaluechanged', onValueChanged)
          c.startNotifications()
        }
      }
    }

    doNotify()
  }, [service, characteristic, setValue])


  return value
}

export function BluetoothDeviceInfo (props: { device?: BluetoothDevice}) {
  const { device } = props

  if(!device) {
    return <p>No Bluetooth device</p>
  }

  return (
    <>
      <h3>Bluetooth device</h3>
      <p>Id: {device.id}</p>
      <p>Name: {device.name ?? "NA"}</p>
      <p>GATT Connected: {device.gatt?.connected ?? "False"}</p>
      <p>UUIDs {device.uuids?.length ?? 0}):</p>
      <ul>
        {(device.uuids ?? []).map(x => <li key={x}>{x}</li>)}
      </ul>
    </>
  )
}

export function BluetoothCharacteristicInfo(props: { characteristic?: BluetoothRemoteGATTCharacteristic}) {
  const { characteristic } = props

  if(!characteristic) {
    return <p>No Bluetooth characteristic</p>
  }

  // TODO: Lazy on preoptyies
  // No read value
  return <>
    <h6>Bluetooth characteristic {characteristic.uuid}</h6>
    <p>{JSON.stringify(characteristic.properties)}</p>
  </>
}

export function BluetoothServiceInfo(props: { service?: BluetoothRemoteGATTService}) {
  const { service } = props

  const characteristics = useBluetoothServiceCharacteristics(service)
  // const services = useBlueoothServiceIncludedServices(services)

  if(!service) {
    return <p>No Bluetooth service</p>
  }

  return <>
    <h5>Bluetooth service {service.uuid}</h5>
    <p>Primary: {service.isPrimary}</p>
    <p>Characteristics ({characteristics.length}):</p>
    {
      characteristics.map(x => <BluetoothCharacteristicInfo key={x.uuid} characteristic={x} />)
    }

  </>
}

export function BluetoothServerInfo (props: { server?: BluetoothRemoteGATTServer}) {

  const { server } = props
  const services = useBluetoothServices(server)

  if(!server) {
    return <p>No Bluetooth server</p>
  }

  return (
    <>
      <h4>Bluetooth server (for device {server.device.id})</h4>
      <p>Connected: {server.connected ?? "False"}</p>
      <p>Primary services ({services.length}):</p>
      <>
        {services.map(x => <div key={x.uuid}><BluetoothServiceInfo service={x} /></div>)}
      </>
    </>
  )
}



export function App() {

  const [device, request] = useBluetoothDevice()
  const server = useBluetoothServer(device)
  // const service = useBluetoothService(server, '')
  // const characteristicValue = useBluetoothCharacteristicValue(service, '')


  return (
    <div>
      <h1>Web Bluetooth</h1>
      <button onClick={request}>Connect to Bluetooth</button>
      <BluetoothDeviceInfo device={device} />
      <BluetoothServerInfo server={server} />
    </div>
  );
}

