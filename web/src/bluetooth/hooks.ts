
import  { useCallback, useEffect, useState } from 'react';


export function useBluetoothDevice(options: RequestDeviceOptions = { acceptAllDevices: true }): [BluetoothDevice | undefined, () => void]  {
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
  
  export function useBluetoothServer(device?: BluetoothDevice): BluetoothRemoteGATTServer | undefined  {
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
  
  export function useBluetoothServices(server: BluetoothRemoteGATTServer | undefined): BluetoothRemoteGATTService[]   {
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
  
  export function useBluetoothService(server: BluetoothRemoteGATTServer | undefined, service: BluetoothServiceUUID): BluetoothRemoteGATTService | undefined  {
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
  
  export function useBluetoothServiceCharacteristics(service: BluetoothRemoteGATTService | undefined): BluetoothRemoteGATTCharacteristic[]  {
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
  
  export function useBluetoothDescriptor(characteristic: BluetoothRemoteGATTCharacteristic | undefined, descriptor: BluetoothDescriptorUUID): BluetoothRemoteGATTDescriptor | undefined {
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
  
  export function useBluetoothDescriptorValueAsString(descriptor?: BluetoothRemoteGATTDescriptor): string {
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
  
  export function useBluetoothDescriptors(characteristic: BluetoothRemoteGATTCharacteristic | undefined): BluetoothRemoteGATTDescriptor[] {
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
  
  export function useReadBluetoothCharacteristicValue<T>(characteristic: BluetoothRemoteGATTCharacteristic | undefined, transform: (data: DataView) => T): T | undefined  {
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
  
  export function useNotifyBluetoothCharacteristicValue<T>(characteristic: BluetoothRemoteGATTCharacteristic | undefined, transform: (data: DataView) => T): T | undefined  {
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