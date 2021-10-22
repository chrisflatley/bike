import * as Ant from '../loghorn-ant-plus'
console.log(Ant)

export function tryAntPlus() {
    const stick = new Ant.GarminStick3

    const sensor = new Ant.BicyclePowerSensor(stick)

    sensor.on('hbData', function (data) {
        console.log(data.DeviceID, data);
    })
    
    // stick.on('startup', function () {
    //     sensor.scan();
    // })

    if(!stick.open()) {
        console.error("Stick not found")
        return
    }


}