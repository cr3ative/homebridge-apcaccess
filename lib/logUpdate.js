const keys = Object.create(null);

const T = () => true;

const createLevel = (logLevel) => (update) => (update ? logLevel : 'debug');
const info = createLevel('info');
const warn = createLevel('warn');
const error = createLevel('error');

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
