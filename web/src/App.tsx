import { useCallback } from 'react';
import { BluetoothDeviceInfo, BluetoothServerInfo, useBluetoothDevice, useBluetoothServer, useBluetoothService, useBluetoothServiceCharacteristic, useNotifyBluetoothCharacteristicValue, useReadBluetoothCharacteristicValue } from './bluetooth';
import {  CYCLING_POWER_FEATURE_CHARACTERISTIC, CYCLING_POWER_MEASUREMENT_CHARACTERISTIC, CYCLING_POWER_SERVICE, DEVICE_INFORMATION_SERVICE, SENSOR_LOCATION_CHARACTERISTIC } from './bluetooth/constants';
import { bufferToHex } from './utils';

class CyclingPowerFeatures {
  public readonly pedalPowerPresent: boolean
  public readonly pedalPowerBalance: boolean
  public readonly accumlatedTorquePresent: boolean
  public readonly accumlatedTorqueSource: string
  public readonly wheelRevolutionPresent: boolean
  public readonly crankRevolutionPresent: boolean
  public readonly extremeForcePresent: boolean
  public readonly extremeTorquePresent: boolean
  public readonly extremeAnglePresent: boolean
  public readonly topDeadSpotAnglePresent: boolean
  public readonly bottomDeadSpotAnglePresent: boolean
  public readonly accumlatedEnergyPresent: boolean
  public readonly offsetCompensationIndicatorPresent: boolean

  constructor(flags: number) {
    this.pedalPowerPresent =       (flags & 0b00000001) > 0
    this.pedalPowerBalance =       (flags & 0b00000010) > 0
    this.accumlatedTorquePresent = (flags & 0b00000100) > 0
    this.accumlatedTorqueSource =  (flags & 0b00001000) ? 'crank' : 'wheel'
    this.wheelRevolutionPresent =  (flags & 0b00010000) > 0
    this.crankRevolutionPresent =  (flags & 0b00100000) > 0
    this.extremeForcePresent =     (flags & 0b01000000) > 0
    this.extremeTorquePresent =    (flags & 0b10000000) > 0

    this.extremeAnglePresent =           (flags & 0b0000000100000000) > 0
    this.topDeadSpotAnglePresent =       (flags & 0b0000001000000000) > 0
    this.bottomDeadSpotAnglePresent =    (flags & 0b0000010000000000) > 0
    this.accumlatedEnergyPresent =       (flags & 0b0000100000000000) > 0
    this.offsetCompensationIndicatorPresent = (flags & 0b0001000000000000) > 0

  }
}

function CyclingPowerFeature(props: { service: BluetoothRemoteGATTService }) {
  const { service } = props

  const transform = useCallback( (x: DataView) => new CyclingPowerFeatures(x.getUint16(0, true)), [])
  const characteristic = useBluetoothServiceCharacteristic(service, CYCLING_POWER_FEATURE_CHARACTERISTIC)
  const features = useReadBluetoothCharacteristicValue(characteristic, transform)

  return (
    <>
    <pre>{JSON.stringify(features, null, 2)}</pre>
    </>
  )

}


class CyclingPowerMeasure {

  public readonly features: CyclingPowerFeatures

  public readonly power: number // Watts
  public readonly pedalPower: number = Number.NaN // Percentage
  public readonly accumlatedTorque: number = Number.NaN // Nm
  public readonly cumulativeWheelRevolutions: number = Number.NaN // count
  public readonly lastWheelEventTime: number = Number.NaN // seconds
  public readonly cumulativeCrankRevolutions: number = Number.NaN // count
  public readonly lastCrankEventTime: number = Number.NaN // seconds

  public readonly maxExtremeForce: number = Number.NaN // N
  public readonly minExtremeForce: number = Number.NaN // N
  public readonly maxExtremeTorque: number = Number.NaN // Nm
  public readonly minExtremeTorque: number = Number.NaN // Nm
  public readonly maxExtremeAngle: number = Number.NaN // degrees
  public readonly minExtremeAngle: number = Number.NaN // degrees

  public readonly topDeadSpotAngle: number = Number.NaN // degrees
  public readonly bottomDeadSpotAngle: number = Number.NaN // degrees
  public readonly accumulatedEnergy: number = Number.NaN // kj


  constructor(data: DataView) {
    this.features = new CyclingPowerFeatures(data.getUint16(0, true))

    // Mandatory
    this.power = data.getInt16(2, true)

    console.log(bufferToHex(data.buffer))


    // Feature flag based

    let offset = 4
    if(this.features.pedalPowerPresent) {
      this.pedalPower = data.getUint8(offset) / 2
      offset++
    }

    if(this.features.accumlatedTorquePresent) {
      this.accumlatedTorque = data.getUint16(offset, true) / 2
      offset+=2
    }

    if(this.features.wheelRevolutionPresent) {
      this.cumulativeWheelRevolutions = data.getUint16(offset)
      offset+=2
      this.lastWheelEventTime = data.getUint16(offset, true) / 2048
      offset+=2
    }

    if(this.features.crankRevolutionPresent) {
      this.cumulativeCrankRevolutions = data.getUint16(offset, true)
      offset+=2
      this.lastCrankEventTime = data.getUint16(offset, true) / 1024
      offset+=2
    }

    if(this.features.extremeForcePresent) {
      this.maxExtremeForce = data.getInt16(offset, true)
      offset+=2
      this.minExtremeForce = data.getInt16(offset, true)
      offset+=2
    }

    if(this.features.extremeTorquePresent) {
      this.maxExtremeTorque = data.getInt16(offset, true) / 32
      offset+=2
      this.minExtremeTorque = data.getInt16(offset, true) / 32
      offset+=2
    }

    if(this.features.extremeAnglePresent) {
      // Three bytes long
      // TODO: unsure if order is reconstructed here
      const field = data.getUint8(offset) + (data.getUint16(offset + 1, true) << 8)
    
      this.maxExtremeAngle = (field & 0xFFF)
      this.minExtremeAngle = (field & 0xFFF000) >> 12
      offset+=3
    }

    if(this.features.topDeadSpotAnglePresent) {
      this.topDeadSpotAngle = data.getInt16(offset, true)
      offset+=2

    }

    if(this.features.bottomDeadSpotAnglePresent) {
      this.bottomDeadSpotAngle = data.getInt16(offset, true)
      offset+=2
    }

    if(this.features.accumlatedEnergyPresent) {
      this.accumulatedEnergy = data.getInt16(offset, true) 
      offset+=2

    }
  }
}

function CyclingPowerMeasurement(props: { service: BluetoothRemoteGATTService }) {
  const { service } = props

  const transform = useCallback( (x: DataView) => new CyclingPowerMeasure(x), [])
  const characteristic = useBluetoothServiceCharacteristic(service, CYCLING_POWER_MEASUREMENT_CHARACTERISTIC)
  const measurement = useNotifyBluetoothCharacteristicValue(characteristic, transform)

  return (
    <>
     <pre>{JSON.stringify(measurement, null, 2)}</pre>
    </>
  )
} 

enum SensorLocationEnum {
 OTHER = 0,
  TOP_OF_SHOE = 1,
  IN_SHOE = 2,
  HIP = 3,
  FRONT_WHEEL = 4,
  LEFT_CRANK = 5,
  RIGHT_CRANK = 6,
  LEFT_PEDAL = 7,
  RIGHT_PEDAL = 8, 
  FRONT_HUB = 9,
  REAR_DROPOUT = 10,
  CHAINSTAY = 11,
  REAR_WHEEL = 12,
  REAR_HUB = 13,
  CHEST = 14,
  SPIDER = 15,
  CHAIN_RING = 16
}

class SensorLocation {

  public readonly location: SensorLocationEnum = SensorLocationEnum.OTHER

  constructor(data: DataView) {
    const field = data.getUint8(0)

    if(field >= 0 && field <= 16) {
      this.location = field 
    } else {
      this.location = SensorLocationEnum.OTHER
    }
  }
}

function SensorLocationInfo(props: { service: BluetoothRemoteGATTService }) {
  const { service } = props

  const transform = useCallback( (x: DataView) => new SensorLocation(x), [])
  const characteristic = useBluetoothServiceCharacteristic(service, SENSOR_LOCATION_CHARACTERISTIC)
  const location = useReadBluetoothCharacteristicValue(characteristic, transform)

  return (
    <>
      <p>Location: {location?.location ?? "Undefined"}</p>
    </>
  )
}

function CyclingPower(props: {server?: BluetoothRemoteGATTServer}) {
    const { server} = props
    const service = useBluetoothService(server, CYCLING_POWER_SERVICE)

    if(!service) {
      return null
    }
    
    return (
      <>
        <CyclingPowerFeature service={service} />
        <hr />
        <SensorLocationInfo service={service} /> 
        <hr />
        <CyclingPowerMeasurement service={service} />
      </>
    )
}


function BluetoothInfo(props: {device?: BluetoothDevice, server?: BluetoothRemoteGATTServer}) {
  const { device, server} = props
  return (
    <div>
      <h1>Web Bluetooth</h1>
      <BluetoothDeviceInfo device={device} />
      <BluetoothServerInfo server={server} />
  </div>
  )

}

export function App() {

  const [device, request] = useBluetoothDevice({
    filters: [{
      services: [CYCLING_POWER_SERVICE]
      
    }],
    optionalServices: [DEVICE_INFORMATION_SERVICE]
  })
  const server = useBluetoothServer(device)


  return (
    <>
      <button onClick={request}>Connect to Bluetooth</button>
        {server && <CyclingPower server={server} />}
      
      <BluetoothInfo device={device} server={server} />
    </>
  );
}

