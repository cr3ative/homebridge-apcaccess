const keys = Object.create(null);

const T = () => true;

const logOnlyError = (log) => ({
  ...log,
  info: T,
  update: T,
});

const logMin = (log) => ({
  ...log,
  update: (key, value) => {
    const update = keys[key] !== value;

    if (update) keys[key] = value;

    return log[update ? 'info' : 'debug'](key, value);
  },
});

module.exports = {
  logMin,
  logOnlyError,
};
