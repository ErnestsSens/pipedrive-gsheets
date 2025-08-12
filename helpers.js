export const log = (...args) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}]`, ...args);
};

export const logError = (...args) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}]`, ...args);
};

export const logWarn = (...args) => {
  const timestamp = new Date().toISOString();
  console.warn(`[${timestamp}]`, ...args);
};
