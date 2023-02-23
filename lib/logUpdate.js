const keys = Object.create(null);

const T = () => true;

const type = (update) => (type) => update ? type : 'debug'
const info = type('info')
const warn = type('warn')
const error = type('error')

const output = (type) =>  (key, value = '') => {
  const update = keys[key] !== value;
  if (update) keys[key] = value;
  return log[type(update)](key, value)
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
  ...log,
  info: T,
  update: {
    info: T,
    warn: T,
    error: T,
  },
});

module.exports = {
  logMin,
  logOnlyError,
};
