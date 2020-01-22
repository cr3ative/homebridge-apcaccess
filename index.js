"use strict";

let Service, Characteristic;
var ApcAccess = require("apcaccess");

module.exports = homebridge => {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory(
    "homebridge-apcaccess",
    "APCAccess",
    ContactSensor
  );
};

function ContactSensor(log, config) {
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
      this.queryAPCAccess.bind(this);
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
    .on("get", this.queryAPCAccess.bind(this));
}

ContactSensor.prototype = {
  queryAPCAccess: function(callback) {
    this.client.getStatusJson().then(result => {
      let flags = result.STATFLAG;
      let value = [flags & 0x08 ? "CONTACT_DETECTED" : "CONTACT_NOT_DETECTED"];
      this.contactSensor.setCharacteristic(
        Characteristic.ContactSensorState,
        value
      );
      if (callback) {
        callback(null, value);
      }
    });
  },
  getServices: function() {
    setInterval(this.queryAPCAccess.bind(this), this.interval * 1000);
    return [this.informationService, this.contactSensor];
  }
};
