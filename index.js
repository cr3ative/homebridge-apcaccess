const ApcAccess = require('apcaccess');
const { logOnlyError, logMin } = require('./lib/logUpdate');

const DEFAULT_INTERVAL = 1;
const DEFAULT_NAME = 'APC UPS';
const DEFAULT_MANIFACTURER = 'American Power Conversion';
const DEFAULT_MODEL = 'APCAccess UPS';
const DEFAULT_PORT = '3551';

const FULLY_CHARGED = 100;
const SECOND = 1000;
const UNKOWN = 'unkown';

const UPS_ACTIVE = 0x08;
const UPS_BATT_LOW = 0x40;
const UPS_NOT_CHARGEABLE = 0x80;
const UPS_NOT_CHARGING = 0x10;

let Service;
let Characteristic;

class APCAccess {
  constructor(log, config) {
    this.config = config || Object.create(null);
    this.log = config.errorLogsOnly ? logOnlyError(log) : logMin(log);
    this.latestJSON = false;
    this.loaded = false;

    this.client = new ApcAccess();
    this.client
      .connect(config.host || 'localhost', config.port || DEFAULT_PORT)
      .then(() => {
        this.log.info('Connected!');
        // set up watcher
        setInterval(this.getLatestJSON.bind(this), (config.interval || DEFAULT_INTERVAL) * SECOND);
      })
      .catch((err) => {
        this.log.error("Couldn't connect to service:", err);
      });

    this.state = Object.seal({
      contact: 0,
      batteryLevel: 0,
      lowBattery: 0,
      minutes: 0,
      chargingState: undefined,
    });

    // The following can't be defined on boot, so define them optionally in config
    this.contactSensor = new Service.ContactSensor(config.name || DEFAULT_NAME);
    this.contactSensor
      .getCharacteristic(Characteristic.ContactSensorState)
      .on('get', this.getContactState.bind(this));

    this.informationService = new Service.AccessoryInformation();
    this.informationService
      .setCharacteristic(
        Characteristic.Manufacturer,
        config.manufacturer || DEFAULT_MANIFACTURER,
      )
      .setCharacteristic(Characteristic.Model, config.model || DEFAULT_MODEL)
      .setCharacteristic(Characteristic.SerialNumber, config.serial || UNKOWN);
    // End of vanity values ;)

    this.batteryService = new Service.BatteryService();
    this.batteryService
      .getCharacteristic(Characteristic.BatteryLevel)
      .on('get', this.getBatteryLevel.bind(this));
    this.batteryService
      .getCharacteristic(Characteristic.ChargingState)
      .on('get', this.getChargingState.bind(this));
    this.batteryService
      .getCharacteristic(Characteristic.StatusLowBattery)
      .on('get', this.getStatusLowBattery.bind(this));

    if (!this.config.temperatureSensor) return;
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
      if (!this.loaded) this.firstRun();
      this.doPolledChecks();
    })
      .catch((err) => {
        this.log.error('Polling UPS service failed:', err);
      });
  }

  firstRun() {
    this.loaded = true;
  }

  getBatteryLevel(callback) {
    callback(null, this.parseBatteryLevel());
  }

  getChargingState(callback) {
    callback(null, Characteristic.ChargingState[this.parseChargingState()]);
  }

  getStatusLowBattery(callback) {
    callback(null, Characteristic.StatusLowBattery[this.parseLowBatteryValue()]);
  }

  getContactState(callback) {
    callback(null, Characteristic.ContactSensorState[this.parseContactValue()]);
  }

  getTemperature(callback) {
    // ITEMP
    let tempPctValue = 0;
    const tempVal = this.latestJSON.ITEMP;

    if (tempVal !== undefined) {
      const tempArray = tempVal.split('.');
      tempPctValue = parseFloat(parseFloat(tempArray[0] * -1) * -1);
      this.log.update.info('Temperature:', tempPctValue);
    } else if(this.loaded){
      this.log.update.error('Unable to determine Temperature');
    }

    callback(null, tempPctValue);
  }

  parseBatteryLevel  = () =>  this.loaded ? parseInt(this.latestJSON.BCHARGE, 10) : 0;

  parseTimeLeft = ( Minutes) => this.loaded ? parseInt(this.latestJSON.TIMELEFT, 10) : 0;

  parseContactValue = () => (this.latestJSON.STATFLAG & UPS_ACTIVE ? 'CONTACT_DETECTED' : 'CONTACT_NOT_DETECTED');

  parseLowBatteryValue = () => (this.latestJSON.STATFLAG & UPS_BATT_LOW ? 'BATTERY_LEVEL_LOW' : 'BATTERY_LEVEL_NORMAL');

  parseChargingState = () => this.latestJSON.STATFLAG & UPS_NOT_CHARGEABLE
    ? 'NOT_CHARGEABLE'
    : this.latestJSON.STATFLAG & UPS_NOT_CHARGING || this.parseBatteryLevel() === FULLY_CHARGED
      ? 'NOT_CHARGING'
      : 'CHARGING';


  checkContact() {
    const contactBool = Characteristic.ContactSensorState[this.parseContactValue()];

    this.log.update.warn('Power:', contactBool ? 'Disconnected' : 'Connected');

    if (this.state.contact !== contactBool) {
      this.log.debug('Pushing contact state change; ', contactBool, this.state.contact);
      this.contactSensor
        .getCharacteristic(Characteristic.ContactSensorState)
        .updateValue(contactBool);
      this.state.contact = contactBool;
    }
  }

  checkLowBattery() {
    const lowBattery = Characteristic.StatusLowBattery[this.parseLowBatteryValue()];

    this.log.update[lowBattery ? 'warn' : 'info']('Battery state:', lowBattery ? 'Low' : 'Normal');

    if (this.state.lowBattery !== lowBattery) {
      this.log.debug('Pushing low battery state change; ', lowBattery, this.state.lowBattery);
      this.batteryService
        .getCharacteristic(Characteristic.StatusLowBattery)
        .updateValue(lowBattery);
      this.state.lowBattery = lowBattery;
    }
  }

  checkCharging() {
    const value = this.parseChargingState()
    const chargingState = Characteristic.ChargingState[value];

    this.log.update.info('Charging state:', value)

    if (this.state.chargingState !== chargingState) {
      this.log.debug('Pushing charging state change; ', chargingState, this.state.chargingState);
      this.batteryService
        .getCharacteristic(Characteristic.ChargingState)
        .updateValue(chargingState);
      this.state.chargingState = chargingState;
    }
  }

  checkBatteryLevel() {
    const batteryLevel = this.parseBatteryLevel();

    this.log.update.info('Battery Level:', `${batteryLevel}% (${this.parseTimeLeft()} estimated minutes remaining)`);

    if (this.state.batteryLevel !== batteryLevel) {
      this.log.debug('Pushing battery level change; ', batteryLevel, this.state.batteryLevel);
      this.batteryService
        .getCharacteristic(Characteristic.BatteryLevel)
        .updateValue(batteryLevel);
      this.state.batteryLevel = batteryLevel;
    }
  }

  doPolledChecks() {
    this.checkContact()
    this.checkLowBattery()
    this.checkCharging()
    this.checkBatteryLevel()
  }
}

module.exports = (homebridge) => {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory('homebridge-apcaccess', 'APCAccess', APCAccess);
};
