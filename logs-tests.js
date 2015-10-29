LogOutput = {
  msgs: []
  , write: function(rec) {
    this.msgs.push(rec);
  }
  , next: function () {
    return this.msgs[this.msgs.length - 1] || {};
  }
};

Log._logger.addStream({
  stream: LogOutput
  , type: 'raw'
});

Tinytest.add('Useful Logs - Log.info - basic log output', function (test) {
  Log.info('x');
  test.equal(LogOutput.next().msg, 'x');

  test.equal(LogOutput.next().name, __meteor_runtime_config__.appId);
  test.equal(LogOutput.next().hostname, __meteor_runtime_config__.ROOT_URL);
  test.equal(LogOutput.next().meteorVersion, __meteor_runtime_config__.meteorRelease);
});

Tinytest.add('Useful Logs - Log.child', function (test) {
  var child = Log.child({
    test: 'y'
  });
  child.info('y');

  test.equal(LogOutput.next().msg, 'y');
  test.equal(LogOutput.next().test, 'y');

  test.equal(LogOutput.next().name, __meteor_runtime_config__.appId);
  test.equal(LogOutput.next().hostname, __meteor_runtime_config__.ROOT_URL);
  test.equal(LogOutput.next().meteorVersion, __meteor_runtime_config__.meteorRelease);
});

Tinytest.add('Useful Logs - Log.withContext', function (test) {
  Log.withContext({
    test: 'z'
  }, function () {
    Log.info('z');
    test.equal(LogOutput.next().msg, 'z');
    test.equal(LogOutput.next().test, 'z');

    test.equal(LogOutput.next().name, __meteor_runtime_config__.appId);
    test.equal(LogOutput.next().hostname, __meteor_runtime_config__.ROOT_URL);
    test.equal(LogOutput.next().meteorVersion, __meteor_runtime_config__.meteorRelease);
  });

  Log.info('y');
  test.equal(LogOutput.next().msg, 'y');
  test.equal(LogOutput.next().test, undefined);
  
  test.equal(LogOutput.next().name, __meteor_runtime_config__.appId);
  test.equal(LogOutput.next().hostname, __meteor_runtime_config__.ROOT_URL);
  test.equal(LogOutput.next().meteorVersion, __meteor_runtime_config__.meteorRelease);
});