# homebridge-apcaccess

An [apcaccess](https://github.com/mapero/apcaccess) wrapper for [Homebridge](https://github.com/nfarina/homebridge). Supports precisely one UPS. If you're on battery power, the Contact Sensor is open.

<img src="https://user-images.githubusercontent.com/1850718/75247783-a0bd6b00-57ca-11ea-9391-0db0afdaf2cf.PNG" width="250"/>

This accessory:

- Is essentially a worse version of [homebridge-accessory-apcupsd](https://github.com/homespun/homebridge-accessory-apcupsd) which I was too dumb to get working; many thanks to homespun.
- Publishes a `ContactSensorService` and a `BatteryService`
- Publishes two subscribable events: `Contact State` and `Low Battery`. The rest pull when you query them.

# Configuration

Whack something like this in your `accessories: []` section of homebridge config:

```
{
    "name": "UPS",
    "accessory": "APCAccess",
    "host": "192.168.86.34",
    "port": 3551,
    "manufacturer": "Fujitsu APC",
    "model": "FJT750i",
    "serial": "AS1305696928",
    "interval": 1
}
```

All pretty self explanatory; `interval` is in seconds.
