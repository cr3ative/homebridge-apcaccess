# [1.0.3]

- Remove instances of WARN, log as INFO or ERROR only to clean up suppression.
- Update packages.

# [1.0.2]

- BATTV isn't guaranteed to be present; fix parseData to not rely on key presence.

# [1.0.1]

- Pretty new display name (via [davidjbradshaw](https://github.com/davidjbradshaw))

# [1.0.0]

- Significant improvements / rewrite, sufficient to declare this v1.0.0, by [davidjbradshaw](https://github.com/davidjbradshaw). Thank you!
- Push realtime data to HomeBridge, rather than just waiting for it to be pulled
- Improved logging
  - Power disconnect/reconnect is now a warning
  - Battery level now shows time remaining and voltage
  - warn/error now also have code to stop the same message being shown twice
- Code refactor
  - Created parse functions, to allow code reuse
  - Upgraded to latest version of esLint/prettier
  - log.update -> log.update.info
  - Defined consts for bitwise values
  - Defined consts for default values
  - Defined consts for magic numbers
- Updated README to show default values

# [0.2.2]

- Add optional temperature sensor. Optional temperature sensor added by [ThisIsQasim](https://github.com/ThisIsQasim). Thank you!
- Logging reduced by default, and new option to omit all logging except errors. Logging improvements by [davidjbradshaw](https://github.com/davidjbradshaw). Thank you!

# [0.1.2]

- Report zero battery level if no bad value passed through to avoid crash.

# [0.1.0]

- Publish battery service in Home friendly way

# [0.0.8]

- Fix client promise handling

# [0.0.7]

- ESLint and Prettier

# [0.0.5/0.0.6]

- Cache the JSON result
- Refactor state
- Secure NPM profile and add keywords

# [0.0.4]

- Tweak name config

# [0.0.3]

- Learned how to push changes to homekit using updateValue. So now it alerts properly!
- We're due a refactor now. But it works!

# [0.0.2]

- Added Battery statistics (on Sensor; in future we may want to reveal as BatteryService)

# [0.0.1]

- Contact State reported on enquiry
