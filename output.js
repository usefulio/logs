ConsolePrinter = function (options) {
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
    console.log(message);
  else if (log.level <= 40) // Warn
    console.warn(message);
  else // Error
    console.error(message);
};