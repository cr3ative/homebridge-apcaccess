# homebridge-apcaccess

A moderately dumb [apcaccess](https://github.com/mapero/apcaccess) wrapper for [Homebridge](https://github.com/nfarina/homebridge).

Supports precisely one UPS, appears as a Contact Sensor, and reports:

* If we're on mains power or not (as a Contact Sensor open (battery) / closed (mains))
* Battery Level (via BatteryService)
* Low Battery State (via BatteryService)
* Charging State (via BatteryService)

The two main values, "Mains/Battery" and "Low Battery State" are "push" values and can be subscribed to. The rest are only queried when you look at the accessory.

This is essentially a worse version of [homebridge-accessory-apcupsd](https://github.com/homespun/homebridge-accessory-apcupsd) which I was too dumb to get working; many thanks to homespun.

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
