# Useful Logs
Bunyan style logging for your meteor apps

## Getting Started

useful:logs makes it easy to have really good logging in your app. Start by just replacing `console.log` statements with `Log` statements:

```js
Meteor.methods({
  'send': function (message) {
    if (!message.sender)
      Log('missing sender!');
      // -> {"name":"myapp","hostname":"myhost","pid":34572,"level":30,"msg":"missing sender!","time":"2013-01-04T07:47:25.814Z","v":0}
  }
})
```

You immediately get the added benefit of some additional logging fields, however the real value of using useful:logs is adding information. You can checkout bunyan's documentation for some examples of the way that different fields/object are added/formatted (especially errors), below we'll give some more meteor-specific examples:

```js
Meteor.methods({
  'send': function (message) {
    Log.with({
      method: 'send'
      , userId: Meteor.userId()
    }, function () {
      if (!message.sender)
        Log('missing sender!');
        // -> {"name":"myapp","hostname":"myhost","pid":34572,"level":30,"msg":"missing sender!","time":"2013-01-04T07:47:25.814Z","v":0, "userId": "xyz", "method": "send"}
    });
  }
})
```

## Goals

1. Flexible output, we want you to be able to output your logs anywhere it makes sense, and in a format that makes them searchable, aggregatable, etc.
2. Simple implementation, it should be really easy to setup and use, and light weight enough to justify using in any app
3. Structured detail, it should be easy to add detail to your logging output without clutering up the output

## Implementation

1. We use bunyan under the hood
2. We export a single global variable `Log` which is a function, and which also provides misc. methods

## API

- `Log(arguments...)` Sends arguments to bunyan's `log.info` method
- `Log.info(arguments), Log.debug, etc.` Sends arguments to the same-named function of bunyan
- `Log.child(options)` Like bunyan's `log.child` method, returns an instance of `Log` that is scoped such messages will include all the options specified.
- `Log.with(options, callback)` like `Log.child` but uses meteor's environment variables to apply the bound options to all calls in the current `environment`, that way you don't have to pass around a scoped `Log` variable. Ideally this should affect all instances of log, even previously created child logs, so that log messages from within a package which are scoped to the package, would also be scoped to a particular request.

## Nice to have

- Run all logs through `Log(message)`, perhaps de-jsonifying any found objects
- Replace meteor's debugging output with ` | bunyan -o short`
- Wrap meteor methods, publiciations, etc. with `Log.with` statements
