# homebridge-apcaccess

An extremely dumb [apcaccess](https://github.com/mapero/apcaccess) wrapper for [Homebridge](https://github.com/nfarina/homebridge).

Supports precisely one UPS and only reports if it's being used (i.e, mains power has gone away) or not.

Large chunks of the actual clever bit of this plugin are from [homebridge-accessory-apcupsd](https://github.com/homespun/homebridge-accessory-apcupsd). Many thanks to homespun.

# Configuration

Whack something like this in your `accessories: []` section of homebridge config:

```
{
    "name": "APC Access",
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