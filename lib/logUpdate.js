const keys = Object.create(null)

module.exports = (log) => ({
  ...log,
  update: (key, value) => {
    if (keys[key] === value) return

    keys[key] = value

    return log.info(key, value)
  }
})
