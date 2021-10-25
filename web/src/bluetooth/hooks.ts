
import { useCallback, useEffect, useState } from 'react';
import { logger } from '../utils'


export function useBluetoothDevice(options: RequestDeviceOptions = { acceptAllDevices: true }): [BluetoothDevice | undefined, () => void] {
    const [device, setDevice] = useState<BluetoothDevice | undefined>(undefined)
    const requestDevice = useCallback(() => {
        async function doRequest() {
            try {
                logger.debug("Requesting bluetooth device")
                const d = await navigator.bluetooth.requestDevice(options)
                setDevice(d)

                // TODO: Should we deal with this nicely?
                // Disconnect then setDevice to null (which should remove off tere)
                //   device.addEventListener('gattserverdisconnected', onDisconnected);

                return
            } catch {
                logger.error("Unable to select bluetooth device")
            }

            setDevice(undefined)
        }
        doRequest()

        return () => {
            setDevice(undefined)
        }
    }, [setDevice, options])

    return [device, requestDevice]
}

export function useBluetoothServer(device?: BluetoothDevice): BluetoothRemoteGATTServer | undefined {
    const [server, setServer] = useState<BluetoothRemoteGATTServer | undefined>(undefined)

    useEffect(() => {
        async function doConnect() {
            logger.debug("Connecting to bluetooth device %s", device?.id)

            if (device && device.gatt) {
                try {
                    const server = await device.gatt.connect()
                    setServer(server)
                    return
                } catch {
                    logger.error("Unable to connect to bluetooth device")
                }
            }

            setServer(undefined)
        }

        doConnect()

        return () => {
            if (device && device.gatt && device.gatt.connected) {
                device.gatt.disconnect()
                setServer(undefined)
            }
        }
    }, [device, setServer])

    return server
}

export function useBluetoothServices(server: BluetoothRemoteGATTServer | undefined): BluetoothRemoteGATTService[] {
    const [services, setServices] = useState<BluetoothRemoteGATTService[]>([])

    useEffect(() => {
        async function doConnect() {
            logger.debug("Listing to bluetooth services %s", server?.device.id)

            if (server) {
                try {
                    const s = await server.getPrimaryServices()
                    setServices(s)
                    return
                } catch {
                    logger.error("Unable to list  bluetooth services")
                }

            }
            setServices([])
        }

        doConnect()
    }, [server, setServices])

    return services
}

export function useBluetoothService(server: BluetoothRemoteGATTServer | undefined, service: BluetoothServiceUUID): BluetoothRemoteGATTService | undefined {
    const [serviceValue, setService] = useState<BluetoothRemoteGATTService | undefined>(undefined)

    useEffect(() => {
        async function doConnect() {
            logger.debug("Connecting to bluetooth service %s %s", server?.device.id, service)

            if (server && service) {
                try {
                    const s = await server.getPrimaryService(service)
                    setService(s)
                    return
                } catch {
                    logger.error("Unable to connect to bluetooth service")

                }
            }

            setService(undefined)
        }

        doConnect()
    }, [server, service, setService])

    return serviceValue
}


export function useBluetoothServiceCharacteristic(service: BluetoothRemoteGATTService | undefined, characteristic: BluetoothCharacteristicUUID): BluetoothRemoteGATTCharacteristic | undefined {
    const [characteristicValue, setCharacteristic] = useState<BluetoothRemoteGATTCharacteristic | undefined>(undefined)

    useEffect(() => {
        async function doGet() {
            logger.debug("Getting  bluetooth characteristic %s %s", service?.uuid, characteristic)

            if (service) {
                try {
                    const c = await service.getCharacteristic(characteristic)
                    setCharacteristic(c)
                    return
                } catch {
                    logger.error("Unable to get to bluetooth characteristic")

                }
            }
            setCharacteristic(undefined)

        }

        doGet()
    }, [service, characteristic, setCharacteristic])


    return characteristicValue
}

export function useBluetoothServiceCharacteristics(service: BluetoothRemoteGATTService | undefined): BluetoothRemoteGATTCharacteristic[] {
    const [characteristics, setCharacteristics] = useState<BluetoothRemoteGATTCharacteristic[]>([])

    useEffect(() => {
        async function doNotify() {
            logger.debug("Getting bluetooth characteristics %s", service?.uuid)

            if (service) {
                try {
                    const c = await service.getCharacteristics()
                    setCharacteristics(c)
                    return
                } catch {
                    logger.error("Unable to get to bluetooth characteristics")

                }
            }
            setCharacteristics([])

        }

        doNotify()
    }, [service, setCharacteristics])


    return characteristics
}

export function useBluetoothDescriptor(characteristic: BluetoothRemoteGATTCharacteristic | undefined, descriptor: BluetoothDescriptorUUID): BluetoothRemoteGATTDescriptor | undefined {
    const [descriptorValue, setDescriptor] = useState<BluetoothRemoteGATTDescriptor | undefined>(undefined)

    useEffect(() => {
        async function doGet() {
            if (characteristic) {
                logger.debug("Getting bluetooth descriptor %s %s", characteristic?.uuid, descriptor)

                try {
                    const c = await characteristic.getDescriptor(descriptor)
                    setDescriptor(c)
                    return
                } catch {
                    logger.error("Unable to get to bluetooth characteristics")
                }
            }

            setDescriptor(undefined)
        }

        doGet()
    }, [characteristic, descriptor, setDescriptor])

    return descriptorValue
}

export function useBluetoothDescriptorValueAsString(descriptor?: BluetoothRemoteGATTDescriptor): string {
    const [value, setValue] = useState<string>("")

    useEffect(() => {
        async function doGet() {
            logger.debug("Getting bluetooth descriptor value %s", descriptor?.uuid)

            if (descriptor) {
                try {
                    const decoder = new TextDecoder('utf-8');
                    const c = await descriptor.readValue()
                    setValue(decoder.decode(c))
                    return
                } catch {
                    logger.error("Unable to get to bluetooth descriptor value")
                }
            }

            setValue("")

        }

        doGet()
    }, [descriptor, setValue])

    return value
}

export function useBluetoothDescriptors(characteristic: BluetoothRemoteGATTCharacteristic | undefined): BluetoothRemoteGATTDescriptor[] {
    const [descriptors, setDescriptors] = useState<BluetoothRemoteGATTDescriptor[]>([])

    useEffect(() => {
        async function doList() {
            logger.debug("Getting bluetooth descriptors %s %s", characteristic?.uuid)

            if (characteristic) {
                try {
                    const c = await characteristic.getDescriptors()
                    setDescriptors(c)
                    return
                } catch {
                    logger.error("Unable to get to bluetooth descriptors")
                }
            }

            setDescriptors([])
        }

        doList()
    }, [characteristic, setDescriptors])

    return descriptors
}

export function useReadBluetoothCharacteristicValue<T>(characteristic: BluetoothRemoteGATTCharacteristic | undefined, transform: (data: DataView) => T): T | undefined {
    const [value, setValue] = useState<T | undefined>(undefined)


    useEffect(() => {
        async function doRead() {
            logger.debug("Getting bluetooth descriptor value %s %s", characteristic?.uuid)

            if (characteristic && characteristic.properties.read) {
                try {
                    const dataView = await characteristic.readValue()
                    const t = transform(dataView)
                    setValue(t)
                    return
                } catch {
                    logger.error("Unable to get to bluetooth descriptor value")
                }
            }

            setValue(undefined)
        }

        doRead()
    }, [characteristic, transform, setValue])


    return value
}

export function useNotifyBluetoothCharacteristicValue<T>(characteristic: BluetoothRemoteGATTCharacteristic | undefined, transform: (data: DataView) => T): T | undefined {
    const [value, setValue] = useState<T | undefined>(undefined)

    useEffect(() => {
        function onValueChanged(event: Event): void {
            const e = event as Event & { target?: { value?: DataView } }
            if (e.target?.value) {
                logger.debug("Notified of characteristic value %s", characteristic?.uuid)
                const t = transform(e.target.value)
                setValue(t)
            }

        }

        async function doNotify() {
            logger.debug("Notified of characteristic value %s", characteristic?.uuid)

            if (characteristic && characteristic.properties.notify) {
                try {
                    characteristic.addEventListener('characteristicvaluechanged', onValueChanged)
                    characteristic.startNotifications()
                    logger.debug("Notification started on characteristic %s", characteristic?.uuid)
                } catch {
                    logger.error("Error notifying on characteristic %s", characteristic?.uuid)
                }
            }
        }

        doNotify()


        return () => {
            logger.debug("Clean up of notified for characteristic value %s", characteristic?.uuid)
            if (characteristic && characteristic.properties.notify) {
                // characteristic.removeEventListener('characteristicvaluechanged', onValueChanged)
                // characteristic.stopNotifications()
                logger.debug("Notification stopped on characteristic %s", characteristic?.uuid)
            }
        }
    }, [characteristic, transform, setValue])


    return value
}