Package.describe({
  name: 'useful:logs',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.1');
  api.use('ecmascript');
  api.use('underscore');
  api.use('useful:logs-standard-config', {
    weak: true
  });
  api.use('useful:logs-standard-hooks', {
    weak: true
  });
  
  Npm.depends({
    bunyan: "1.5.1"
  });

  api.addFiles('output.js', 'server');
  api.addFiles('logs.js', 'server');
  api.export('Log');
  api.export('Logger');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('useful:logs');
  api.addFiles('logs-tests.js', 'server');
});
