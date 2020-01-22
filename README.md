# homebridge-apcaccess

A moderately dumb [apcaccess](https://github.com/mapero/apcaccess) wrapper for [Homebridge](https://github.com/nfarina/homebridge).

Supports precisely one UPS, appears as a Contact Sensor, and reports:

* Battery Level
* Low Battery State
* Charging State
* If we're on mains power or not

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