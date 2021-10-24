import { BluetoothDeviceInfo, BluetoothServerInfo, useBluetoothDevice, useBluetoothServer } from './bluetooth';
import {  CYCLING_POWER_SERVICE, DEVICE_INFORMATION_SERVICE } from './bluetooth/constants';


function CyclingPower(props: {device?: BluetoothDevice}) {

    

    return (
      <>
      <p>TODO</p>
      </>
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
      <div>
        {device && <CyclingPower device={device} />}
      </div>
      <div>
        <h1>Web Bluetooth</h1>
        <button onClick={request}>Connect to Bluetooth</button>
        <BluetoothDeviceInfo device={device} />
        <BluetoothServerInfo server={server} />
      </div>
    </>
  );
}

