let Service;
let Characteristic;
const ApcAccess = require('apcaccess');
const { logOnlyError, logMin } = require('./lib/logUpdate');

class APCAccess {
  constructor(log, config) {
    this.config = config;
    this.log = config.errorLogsOnly ? logOnlyError(log) :logMin(log);
    this.latestJSON = false;

    this.client = new ApcAccess();
    this.client
      .connect(config.host || 'localhost', config.port || '3551')
      .then(() => {
        this.log.info('Connected!');
        // set up watcher
        setInterval(this.getLatestJSON.bind(this), (config.interval || 1) * 1000);
      })
      .catch((err) => {
        this.log.error("Couldn't connect to service:", err);
      });

    this.state = {
      contact: 0,
      lowBattery: 0,
    };

    // The following can't be defined on boot, so define them optionally in config
    this.contactSensor = new Service.ContactSensor(config.name || 'APCAccess UPS');
    this.contactSensor
      .getCharacteristic(Characteristic.ContactSensorState)
      .on('get', this.getContactState.bind(this));

    this.informationService = new Service.AccessoryInformation();
    this.informationService
      .setCharacteristic(
        Characteristic.Manufacturer,
        config.manufacturer || 'American Power Conversion',
      )
      // I see MODEL: 'Smart-UPS 750 ', in the data
      .setCharacteristic(Characteristic.Model, config.model || 'APCAccess UPS')

      // At least for my device I'm seeing a S/N being return in the data
      // I'm also seeing Firmware version, which can also be set as a characteristic in HK
      // SERIALNO: 'AS1539123101  ',
      // FIRMWARE: 'UPS 09.3 / ID=18',
      .setCharacteristic(Characteristic.SerialNumber, config.serial || '0118-999-88199-9119-725-3');
    // End of vanity values ;)

    this.batteryService = new Service.BatteryService();
    this.batteryService
      .getCharacteristic(Characteristic.BatteryLevel)
      .on('get', this.getBatteryLevel.bind(this))
      .getCharacteristic(Characteristic.ChargingState)
      .on('get', this.getChargingState.bind(this))
      .getCharacteristic(Characteristic.StatusLowBattery)
      .on('get', this.getStatusLowBattery.bind(this));

    if(!this.config.temperatureSensor) return;
    this.temperatureService = new Service.TemperatureSensor();
    this.temperatureService
      .getCharacteristic(Characteristic.CurrentTemperature)
      .on('get', this.getTemperature.bind(this));
  }

  getServices() {
    // Required by Homebridge; expose services this accessory claims to have
    const services = [this.informationService, this.contactSensor, this.batteryService];

    if (this.temperatureService) {
      services.push(this.temperatureService);
    }

    return services;
  }

  getLatestJSON() {
    this.client.getStatusJson().then((result) => {
      this.latestJSON = result;
      this.doPolledChecks();
    })
    .catch((err) => {
      this.log.error("Polling device failed:", err);
    });
  }

  getBatteryLevel(callback) {
    // BCHARGE
    let battPctValue = 0;
    const battVal = this.latestJSON.BCHARGE;

    if (battVal) {
      const battArray = battVal.split('.');
      battPctValue = parseFloat(parseFloat(battArray[0] * -1) * -1);
    }

    this.log.update('Battery Level: ', battPctValue);
    callback(null, battPctValue);
  }

  getChargingState(callback) {
    // STATFLAG
    const percentage = parseInt(this.latestJSON.BCHARGE, 10);
    const value = this.latestJSON.STATFLAG & 0x80
      ? 'NOT_CHARGEABLE'
      : this.latestJSON.STATFLAG & 0x10 || percentage === 100
        ? 'NOT_CHARGING'
        : 'CHARGING';

    this.log.update('Charging state: ', value);
    callback(null, Characteristic.ChargingState[value]);
  }

  getStatusLowBattery(callback) {
    // STATFLAG
    const value = this.latestJSON.STATFLAG & 0x40 ? 'BATTERY_LEVEL_LOW' : 'BATTERY_LEVEL_NORMAL';

    this.log.update('Low Battery? ', value);
    callback(null, Characteristic.StatusLowBattery[value]);
  }

  getContactState(callback) {
    // STATFLAG
    const value = [this.latestJSON.STATFLAG & 0x08 ? 'CONTACT_DETECTED' : 'CONTACT_NOT_DETECTED'];

    // it would be good to log out start time as a warning here
    if (value === 'CONTACT_NOT_DETECTED') {
      this.warn('UPS Active', this.latestJSON.STARTTIME)
    }

    callback(null, Characteristic.ContactSensorState[value]);
  }

  getTemperature(callback) {
    // ITEMP
    let tempPctValue = 0;
    const tempVal = this.latestJSON.ITEMP;

    if (tempVal !== undefined) {
      const tempArray = tempVal.split('.');
      tempPctValue = parseFloat(parseFloat(tempArray[0] * -1) * -1);
      this.log.update('Temperature: ', tempPctValue);
    } else {
      this.log.error('Unable to determine Temperature: ', this.latestJSON);
    }

    callback(null, tempPctValue);
  }

  doPolledChecks() {
    const contactValue = [
      this.latestJSON.STATFLAG & 0x08 ? 'CONTACT_DETECTED' : 'CONTACT_NOT_DETECTED',
    ];
    const contactBool = Characteristic.ContactSensorState[contactValue];
    const lowBattValue = this.latestJSON.STATFLAG & 0x40 ? 'BATTERY_LEVEL_LOW' : 'BATTERY_LEVEL_NORMAL';
    const lowBattBool = Characteristic.StatusLowBattery[lowBattValue];

    // push
    if (this.state.contact !== contactBool) {
      this.log.debug('Pushing contact state change; ', contactBool, this.state.contact);
      this.contactSensor
        .getCharacteristic(Characteristic.ContactSensorState)
        .updateValue(contactBool);
      this.state.contact = contactBool;
    }

    if (this.state.lowBattery !== lowBattBool) {
      this.log.debug('Pushing low battery state change; ', lowBattBool, this.state.lowBattery);
      this.contactSensor
        .getCharacteristic(Characteristic.StatusLowBattery)
        .updateValue(lowBattBool);
      this.state.lowBattery = lowBattBool;
    }
  }
}

module.exports = (homebridge) => {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory('homebridge-apcaccess', 'APCAccess', APCAccess);
};
