const keys = Object.create(null)

module.exports = (log) => ({
  ...log,
  update: (key, value) => {
    const update = (keys[key] !== value)

    if(update) keys[key] = value

    return log[update ? 'info' : 'debug'](key, value)
  }
})
