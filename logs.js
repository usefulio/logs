// Write your package code here!
var bunyan = Npm.require('bunyan');

var currentLoggerOptions = new Meteor.EnvironmentVariable();
Logger = function (options, parent) {
  if (parent) {
    _.defaults(options, parent._options);
    this._options = options;
    this._logger = parent._logger.child(_.omit(options, 'name'));
    this._context = parent._context;
  } else {
    _.defaults(options, {
      name: __meteor_runtime_config__.appId
      , hostname: __meteor_runtime_config__.ROOT_URL
      , meteorVersion: __meteor_runtime_config__.meteorRelease
    });
    this._options = options;
    this._logger = bunyan.createLogger(options);
    this._context = new Meteor.EnvironmentVariable();
  }
};

Logger.prototype.withContext = function (options, fn) {
  options = _.defaults(options, this._context.get() || {});
  return this._context.withValue(options, fn);
};

Logger.prototype.processArguments = function (args) {
  var options = this._context.get();
  if (options) {
    var firstArg = args[0];
    if (_.isObject(firstArg))
      _.extend(firstArg, options);
    else
      args.unshift(options);
  }
};

Logger.prototype.log = function() {
  return this.info.apply(this, arguments);
};

Logger.prototype.child = function (options) {
  return new Logger(options, this);
};

_.each(['fatal', 'error', 'warn', 'info', 'debug', 'trace'], function (level) {
  Logger.prototype[level] = function () {
    var args = _.toArray(arguments);
    this.processArguments(args);
    return this._logger[level].apply(this._logger, args);
  };
});

var configPackage = Package["useful:logs-standard-config"];
var config;
if (configPackage && _.isFunction(configPackage.LogsConfig)) {
  config = configPackage.LogsConfig(bunyan);
} else {
  if (configPackage)
    console.warn('config package does not export LogsConfig global');
  config = {
    streams: [{
      stream: new ConsolePrinter()
      , type: 'raw'
    }]
  };
}

Log = new Logger(config);

var hooksPackage = Package["useful:logs-standard-hooks"];
if (hooksPackage && _.isFunction(hooksPackage.LogsHook)) {
  hooksPackage.LogsHook(Log);
}
