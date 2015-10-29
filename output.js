ConsolePrinter = function (options) {
  this.log = console.log;
  this.warn = console.warn;
  this.error = console.error;
  this.options = _.defaults(options || {}, {

  });
};

ConsolePrinter.prototype.write = function(log) {
  var toPrint = _.omit(log
    , 'v'
    , 'time'
    , 'name'
    , 'hostname'
    , 'meteorVersion'
    , 'pid'
    , 'msg'
    , 'level'
  );
  var message = log.msg;
  if (_.keys(toPrint).length)
    message += " - " + JSON.stringify(toPrint);

  if (log.level <= 30) // Info
    this.log(message);
  else if (log.level <= 40) // Warn
    this.warn(message);
  else // Error
    this.error(message);
};
