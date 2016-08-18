import { Logger, Message } from "./logger.js";

function makeDefaultLogger(userLogger) {
  const Log = userLogger || new Logger();

  // Default handler for objects
  Log.attachDetailHandler((detail, message) => {
    if (
      _.isObject(detail) && !_.isRegExp(detail)
    ) {
      if (!(message instanceof Message)) {
        Logger._logWarning(
          "Logging of nested objects is not recommended. messageId:",
          Log.currentId.getOrNullIfOutsideFiber(),
        );
        return false;
      }
      const subdoc = _.isArray(detail) ? [] : {};
      _.each(detail, (val, i) => {
        let parsed;
        const obj = {};
        _.find(Log.detailHandlers(), (handler) => {
          parsed = handler(val, obj);
          return !!detail;
        });
        if (parsed === true) {
          parsed = obj;
        }
        if (parsed) {
          subdoc[i] = parsed;
        } else {
          subdoc[i] = val;
        }
      });
      return subdoc;
    }
    return false;
  });
  // Log levels
  Log.logLevels = {
    fatal: 60,
    error: 50,
    warn: 40,
    info: 30,
    debug: 20,
    trace: 10,
  };
  _.each(Log.logLevels, (level, name) => {
    Log[name] = function(...args) {
      this.logWithOptions([name].concat(args));
    };
  });
  Log.attachDetailHandler((detail, message) => {
    if (message.level) return;
    if (_.find(Log.logLevels, (level, name) => {
      if (detail === name) {
        message.level = level;
        return true;
      }
    })) return;
    // XXX set a default level or not?
    // message.level = 30;
  });
  Log.timingLogLevel = Log.logLevels.trace;
  Log.attachDetailHandler((detail, message) => {
    if (detail === "started" || detail === "ended") {
      message.level = Log.timingLogLevel;
    }
  });
  Log.consoleLogLevel = 30;
  Log.consoleWarnLevel = 40;
  Log.consoleErrorLevel = 50;
  Log.attachMessageHandler((message) => {
    if (!message.level || message.level >= Log.consoleLogLevel) {
      if (message.level >= Log.consoleErrorLevel) {
        Logger._logError.apply(Logger, message.message);
      } else if (message.level >= Log.consoleWarnLevel) {
        Logger._logWarning.apply(Logger, message.message);
      } else {
        Logger._logLog.apply(Logger, message.message);
      }
    }
  });

  Log.logMessagesToDB = (collection) => {
    let cache = [];
    let flushCacheError;
    let flushCacheErrorCount = 0;
    let flushCacheTimestamp = Date.now();

    function insert(doc) {
      cache.push(doc);

      if (cache.length > 100) {
        // console.log(`Flushing cache because cache length is greater than 100 (${cache.length})`);
        Meteor.setTimeout(flushCache, 0);
      }
    }

    function flushCache() {

      if (! cache.length) {
        return;
      }

      // Throttle writing to the db if we're running into errors inserting
      if (flushCacheError) {
        const retryInterval = 1000 * Math.pow(2, flushCacheErrorCount);
        if (flushCacheTimestamp + retryInterval > Date.now()) {
          return;
        }
      }

      // Throttle writing to the db if there aren't many logs. There will always
      // be at least two logs in the cache because we're writing to the logs
      // every time we flush the cache.
      if (cache.length <= 2) {
        const heartbeatInterval = 1000 * 60;
        if (flushCacheTimestamp + heartbeatInterval > Date.now()) {
          return;
        }
      }

      const toInsert = cache;

      cache = [];

      // console.log(`Flushing ${toInsert.length} logs from the cache.`);

      flushCacheTimestamp = Date.now();

      Log.wrapAndRun(() => {
        collection.batchInsert(toInsert);

        // throw new Error("Testing error throttling.");
      }, "Flushing logs to the cache", (error) => {
        // XXX add unsent items to the cache?

        flushCacheErrorCount++;
        flushCacheError = error;
        Log.error(error);

        // Let the default onError log this in case there's something really
        // messed up with logging. This will mean that if logging is working
        // the error will be logged twice, which is not ideal. But then, it's
        // not ideal that this method is broken.
        throw error;
      });

      flushCacheError = null;
      flushCacheErrorCount = 0;
    }

    function maybeFlushCache() {
      // console.log(`Maybe flushing cache because 1 second has elapsed.`);
      flushCache();
      Meteor.setTimeout(maybeFlushCache, 2000);
    }

    maybeFlushCache();

    Log.attachMessageHandler((message) => {
      insert(message);
    });
  };

  return Log;
}

export { makeDefaultLogger };
export default makeDefaultLogger;