const keys = Object.create(null);

const T = () => true;

const level = (update) => (logLevel) => update ? logLevel : 'debug'
const info = level('info')
const warn = level('warn')
const error = level('error')

const output = (level) =>  (key, value = '') => {
  const update = keys[key] !== value;
  if (update) keys[key] = value;
  return log[level(update)](key, value)
}

const logMin = (log) => ({
  ...log,
  update: {
    info: output(info),
    warn: output(warn),
    error: output(error),
  },
});

const logOnlyError = (log) => ({
  ...logMin(log),
  info: T,
  update: {
    info: T,
  },
});

module.exports = {
  logMin,
  logOnlyError,
};
