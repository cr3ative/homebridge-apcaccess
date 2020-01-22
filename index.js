"use strict";

// {
//   APC: '001,027,0658',
//   DATE: '2020-01-22 13:49:38 +0000  ',
//   HOSTNAME: 'pi.local',
//   VERSION: '3.14.14 (31 May 2016) debian',
//   UPSNAME: 'SMT750i',
//   CABLE: 'USB Cable',
//   DRIVER: 'USB UPS Driver',
//   UPSMODE: 'Stand Alone',
//   STARTTIME: '2020-01-21 22:41:56 +0000  ',
//   MODEL: 'Smart-UPS 750 ',
//   STATUS: 'ONLINE ',
//   BCHARGE: '100.0 Percent',
//   TIMELEFT: '270.0 Minutes',
//   MBATTCHG: '5 Percent',
//   MINTIMEL: '3 Minutes',
//   MAXTIME: '0 Seconds',
//   ALARMDEL: '30 Seconds',
//   BATTV: '27.1 Volts',
//   NUMXFERS: '0',
//   TONBATT: '0 Seconds',
//   CUMONBATT: '0 Seconds',
//   XOFFBATT: 'N/A',
//   STATFLAG: '0x05000008',
//   MANDATE: '2013-02-02',
//   SERIALNO: 'AS1305112528  ',
//   NOMBATTV: '24.0 Volts',
//   FIRMWARE: 'UPS 08.3 / ID=18',
//   'END APC': '2020-01-22 13:49:57 +0000  '
// }

let Service, Characteristic;
var ApcAccess = require("apcaccess");

module.exports = homebridge => {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-apcaccess", "APCAccess", APCAccess);
};

function APCAccess(log, config) {
  this.log = log;
  this.host = config["host"] || "localhost";
  this.port = config["port"] || "3551";
  this.interval = config["interval"] || 1;
  // The following can't be defined on boot, so define them optionally in config
  this.manufacturer = config["manufacturer"] || "American Power Conversion";
  this.model = config["model"] || "My Fantastic UPS";
  this.name = config["name"] || "My Fantastic UPS";
  this.serial = config["serial"] || "123-456-789";

  this.client = new ApcAccess();
  this.client
    .connect(this.host, this.port)
    .then(() => {
      this.log("Connected!");
      this.getContactState.bind(this);
    })
    .catch(err => {
      this.log("Couldn't connect to service:", err);
    });

  this.contactSensor = new Service.ContactSensor(this.name);
  this.informationService = new Service.AccessoryInformation();

  this.informationService
    .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
    .setCharacteristic(Characteristic.Model, this.model)
    .setCharacteristic(Characteristic.SerialNumber, this.serial);

  this.contactSensor
    .getCharacteristic(Characteristic.ContactSensorState)
    .on("get", this.getContactState.bind(this));
  this.contactSensor
    .getCharacteristic(Characteristic.BatteryLevel)
    .on("get", this.getBatteryLevel.bind(this));
  this.contactSensor
    .getCharacteristic(Characteristic.ChargingState)
    .on("get", this.getChargingState.bind(this));
  this.contactSensor
    .getCharacteristic(Characteristic.StatusLowBattery)
    .on("get", this.getStatusLowBattery.bind(this));
}

APCAccess.prototype = {
  getBatteryLevel: function(callback) {
    this.client.getStatusJson().then(result => {
      // BCHARGE
      let percentage = parseInt(result.BCHARGE, 10);
      this.log("Battery Level: ", percentage);
      this.contactSensor.setCharacteristic(
        Characteristic.BatteryLevel,
        percentage
      );
      callback(null, percentage);
    });
  },
  getChargingState: function(callback) {
    this.client.getStatusJson().then(result => {
      // STATFLAG
      let percentage = parseInt(result.BCHARGE, 10);
      let value =
        result.STATFLAG & 0x80
          ? "NOT_CHARGEABLE"
          : result.STATFLAG & 0x10 || percentage === 100
          ? "NOT_CHARGING"
          : "CHARGING";
      this.log("Charging state: ", value);
      this.contactSensor.setCharacteristic(Characteristic.ChargingState, value);
      callback(null, Characteristic.ChargingState[value]);
    });
  },
  getStatusLowBattery: function(callback) {
    this.client.getStatusJson().then(result => {
      // STATFLAG
      let value =
        result.STATFLAG & 0x40 ? "BATTERY_LEVEL_LOW" : "BATTERY_LEVEL_NORMAL";
      this.log("Low Battery? ", value);
      this.contactSensor.setCharacteristic(
        Characteristic.StatusLowBattery,
        value
      );
      callback(null, Characteristic.StatusLowBattery[value]);
    });
  },
  getContactState: function(callback) {
    this.client.getStatusJson().then(result => {
      let value = [
        result.STATFLAG & 0x08 ? "CONTACT_DETECTED" : "CONTACT_NOT_DETECTED"
      ];
      this.contactSensor.setCharacteristic(
        Characteristic.ContactSensorState,
        value
      );
      if (callback) {
        callback(null, Characteristic.ContactSensorState[value]);
      }
    });
  },
  getServices: function() {
    // watch contact state on an interval
    setInterval(this.getContactState.bind(this), this.interval * 1000);
    return [this.informationService, this.contactSensor];
  }
};
