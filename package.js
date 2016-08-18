Package.describe({
  name: 'useful:logs',
  version: '0.1.0',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.use([
    'ecmascript',
    'underscore',
    // XXX mongo should become a weak dependency
    'mongo',
  ]);
  api.use([
    'mikowals:batch-insert',
  ]);

  api.mainModule('logs.js');

  api.export('Log');
});

Package.onTest(function(api) {
  api.use([
    'ecmascript',
    'underscore',
    // XXX mongo should become a weak dependency
    'mongo',
  ]);
  api.use('practicalmeteor:mocha');

  api.use('useful:logs');
  api.mainModule('logs-tests.js');
});
