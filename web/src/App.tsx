import  { useCallback, useEffect, useState } from 'react';
import { CHARACTERISTIC_USER_DECRIPTION_DESCRIPTOR, CYCLING_POWER_SERVICE } from './constants';

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

function useBluetoothDescriptor(characteristic: BluetoothRemoteGATTCharacteristic | undefined, descriptor: BluetoothDescriptorUUID): BluetoothRemoteGATTDescriptor | undefined {
  const [descriptorValue, setDescriptor] = useState<BluetoothRemoteGATTDescriptor | undefined>(undefined)
  
  useEffect(() => {
    async function doGet() {
      if(characteristic) {
        const c = await characteristic.getDescriptor(descriptor)
        setDescriptor(c)
      } else {
        setDescriptor(undefined)
      }
    }

    doGet()
  }, [characteristic, descriptor, setDescriptor])

  return descriptorValue
}

function useBluetoothDescriptorValueAsString(descriptor?: BluetoothRemoteGATTDescriptor): string {
  const [value, setValue] = useState<string>("")

   
  useEffect(() => {
    async function doGet() {
      if(descriptor) {
        try {
          const decoder = new TextDecoder('utf-8');
          const c = await descriptor.readValue()
          setValue(decoder.decode(c))
        } catch {
          setValue("")
        }
      } else {
        setValue("")
      }
    }

    doGet()
  }, [descriptor, setValue])

  return value
}

function useBluetoothDescriptors(characteristic: BluetoothRemoteGATTCharacteristic | undefined): BluetoothRemoteGATTDescriptor[] {
  const [descriptors, setDescriptors] = useState<BluetoothRemoteGATTDescriptor[]>([])

  useEffect(() => {
    async function doList() {
      if(characteristic) {
        const c = await characteristic.getDescriptors()
        setDescriptors(c)
      } else {
        setDescriptors([])
      }
    }

    doList()
  }, [characteristic, setDescriptors])

  return descriptors
}

function useReadBluetoothCharacteristicValue<T>(characteristic: BluetoothRemoteGATTCharacteristic | undefined, transform: (data: DataView) => T): T | undefined  {
  const [value, setValue] = useState<T | undefined>(undefined)

  useEffect(() => {
    async function doRead() {
      if(characteristic && characteristic.properties.read) {
        const dataView = await characteristic.readValue()
        const t = transform(dataView)
        setValue(t)
      }
    }

    doRead()
  }, [characteristic, transform, setValue])


  return value
}

function useNotifyBluetoothCharacteristicValue<T>(characteristic: BluetoothRemoteGATTCharacteristic | undefined, transform: (data: DataView) => T): T | undefined  {
  const [value, setValue] = useState<T | undefined>(undefined)

  useEffect(() => {
    function onValueChanged(event: Event): void {
      const e =  event as Event & { target?: { value?: DataView }}
      if(e.target?.value) {
        const t = transform(e.target.value)
        setValue(t)
      }

    }

    async function doNotify() {
      if(characteristic && characteristic.properties.notify) {
        characteristic.addEventListener('characteristicvaluechanged', onValueChanged)
        characteristic.startNotifications()
      }
    }

    doNotify()

    // TODO: Remove notification
  }, [characteristic, transform, setValue])


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

export function BluetoothCharacteristicProperty(props: { title: string, value: boolean}) {
  const { title, value } = props
  return (
    <span>{title}: {value ? "Y" : "N"}</span>
  )
}

export function BluetoothCharacteristicInfo(props: { characteristic?: BluetoothRemoteGATTCharacteristic}) {
  const { characteristic } = props
  const read = useReadBluetoothCharacteristicValue<string>(characteristic, x => `Read data is ${x.byteLength} bytes`)
  const notified = useNotifyBluetoothCharacteristicValue<string>(characteristic, x => `Notify data is ${x.byteLength} bytes`)

  const descriptors = useBluetoothDescriptors(characteristic)


  const descriptionDescriptor = useBluetoothDescriptor(characteristic, CHARACTERISTIC_USER_DECRIPTION_DESCRIPTOR)
  const description = useBluetoothDescriptorValueAsString(descriptionDescriptor)

  if(!characteristic) {
    return <p>No Bluetooth characteristic</p>
  }

  
  return <>
    <h6>Bluetooth characteristic {characteristic.uuid}</h6>
    <p>{description}</p>
    <ul>
      <li><BluetoothCharacteristicProperty title="authenticatedSignedWrites" value={characteristic.properties.authenticatedSignedWrites} /></li>
      <li><BluetoothCharacteristicProperty title="broadcast" value={characteristic.properties.broadcast} /></li>
      <li><BluetoothCharacteristicProperty title="indicate" value={characteristic.properties.indicate} /></li>
      <li><BluetoothCharacteristicProperty title="notify" value={characteristic.properties.notify} /></li>
      <li><BluetoothCharacteristicProperty title="read" value={characteristic.properties.read} /></li>
      <li><BluetoothCharacteristicProperty title="reliableWrite" value={characteristic.properties.reliableWrite} /></li>
      <li><BluetoothCharacteristicProperty title="writableAuxiliaries" value={characteristic.properties.writableAuxiliaries} /></li>
      <li><BluetoothCharacteristicProperty title="write" value={characteristic.properties.write} /></li>
      <li><BluetoothCharacteristicProperty title="writeWithoutResponse" value={characteristic.properties.writeWithoutResponse} /></li>
    </ul>
    <p>{read}</p>
    <p>{notified}</p>
    <ul>
      {descriptors.map(x => 
        <li key={x.uuid}>{x.uuid}</li>
      )}
    </ul>
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

  const [device, request] = useBluetoothDevice({
    filters: [{
      services: [CYCLING_POWER_SERVICE]
    }]
  })
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

