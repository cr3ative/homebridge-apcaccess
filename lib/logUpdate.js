const keys = Object.create(null);

const T = () => true;

const level = (logLevel) => (update) => (update ? logLevel : 'debug');
const info = level('info');
const warn = level('warn');
const error = level('error');

const output = (level) => (log) => (key, value = '') => {
  const update = keys[key] !== value;
  if (update) keys[key] = value;
  return log[level(update)](key, value);
};

const logMin = (log) => ({
  ...log,
  update: {
    info: output(info)(log),
    warn: output(warn)(log),
    error: output(error)(log),
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
