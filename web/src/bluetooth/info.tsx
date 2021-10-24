import { CHARACTERISTIC_USER_DECRIPTION_DESCRIPTOR } from "./constants"
import { useNotifyBluetoothCharacteristicValue, useReadBluetoothCharacteristicValue, useBluetoothDescriptors, useBluetoothDescriptor, useBluetoothDescriptorValueAsString, useBluetoothServiceCharacteristics, useBluetoothServices } from "./hooks"

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