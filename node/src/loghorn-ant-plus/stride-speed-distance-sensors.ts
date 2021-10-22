/*
 * ANT+ profile: https://www.thisisant.com/developer/ant-plus/device-profiles/#528_tab
 * Spec sheet: https://www.thisisant.com/resources/stride-based-speed-and-distance-monitor/
 */

import { AntPlusSensor, AntPlusScanner, Messages } from './ant';
import { Channel, DeviceId } from './types';

class StrideSpeedDistanceSensorState {
	constructor(deviceId: number) {
		this.DeviceID = deviceId;
	}

	DeviceID: number;
	TimeFractional = 0;
	TimeInteger = 0;
	DistanceInteger = 0;
	DistanceFractional = 0;
	SpeedInteger = 0;
	SpeedFractional = 0;
	StrideCount = 0;
	UpdateLatency = 0;
	CadenceInteger = 0;
	CadenceFractional = 0;
	Status = 0;
	Calories = 0;
}

class StrideSpeedDistanceScanState extends StrideSpeedDistanceSensorState {
	Rssi = 0;
	Threshold = 0;
}

enum PageState { INIT_PAGE, STD_PAGE, EXT_PAGE }

export class StrideSpeedDistanceSensor extends AntPlusSensor {
	static deviceType = 124;

	public attach(channel: Channel, deviceID: DeviceId) {
		super.attach(channel, 'receive', deviceID, StrideSpeedDistanceSensor.deviceType, 0, 255, 8134);
		this.state = new StrideSpeedDistanceSensorState(deviceID);
	}

	private state: StrideSpeedDistanceSensorState | undefined;

	protected updateState(deviceId: DeviceId, data: SensorData) {
		this.state.DeviceID = deviceId;
		updateState(this, this.state, data);
	}
}

export class StrideSpeedDistanceScanner extends AntPlusScanner {
	protected deviceType() {
		return StrideSpeedDistanceSensor.deviceType;
	}

	private states: { [id: number]: StrideSpeedDistanceScanState } = {};

	protected createStateIfNew(deviceId) {
		if (!this.states[deviceId]) {
			this.states[deviceId] = new StrideSpeedDistanceScanState(deviceId);
		}
	}

	protected updateRssiAndThreshold(deviceId, rssi, threshold) {
		this.states[deviceId].Rssi = rssi;
		this.states[deviceId].Threshold = threshold;
	}

	protected updateState(deviceId, data) {
		updateState(this, this.states[deviceId], data);
	}
}

function updateState(
	sensor: StrideSpeedDistanceSensor | StrideSpeedDistanceScanner,
	state: StrideSpeedDistanceSensorState | StrideSpeedDistanceScanState,
	data: Buffer) {

	const page = data.readUInt8(Messages.BUFFER_INDEX_MSG_DATA);
	if (page === 1) {
		state.TimeFractional = data.readUInt8(Messages.BUFFER_INDEX_MSG_DATA + 1);
		state.TimeInteger = data.readUInt8(Messages.BUFFER_INDEX_MSG_DATA + 2);
		state.DistanceInteger = data.readUInt8(Messages.BUFFER_INDEX_MSG_DATA + 3);
		state.DistanceFractional = data.readUInt8(Messages.BUFFER_INDEX_MSG_DATA + 4) >>> 4;
		state.SpeedInteger = data.readUInt8(Messages.BUFFER_INDEX_MSG_DATA + 4) & 0x0F;
		state.SpeedFractional = data.readUInt8(Messages.BUFFER_INDEX_MSG_DATA + 5);
		state.StrideCount = data.readUInt8(Messages.BUFFER_INDEX_MSG_DATA + 6);
		state.UpdateLatency = data.readUInt8(Messages.BUFFER_INDEX_MSG_DATA + 7);
	} else if (page >= 2 && page <= 15) {
		state.CadenceInteger = data.readUInt8(Messages.BUFFER_INDEX_MSG_DATA + 3);
		state.CadenceFractional = data.readUInt8(Messages.BUFFER_INDEX_MSG_DATA + 4) >>> 4;
		state.SpeedInteger = data.readUInt8(Messages.BUFFER_INDEX_MSG_DATA + 4) & 0x0F;
		state.SpeedFractional = data.readUInt8(Messages.BUFFER_INDEX_MSG_DATA + 5);
		state.Status = data.readUInt8(Messages.BUFFER_INDEX_MSG_DATA + 7);

		switch (page) {
			case 3:
				state.Calories = data.readUInt8(Messages.BUFFER_INDEX_MSG_DATA + 6);
				break;
			default:
				break;
		}
	}
	sensor.emit('ssddata', state);
	sensor.emit('ssdData', state);
}
