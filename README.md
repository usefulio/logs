# Useful Logs
Bunyan style logging for your meteor apps

## Goals

1. Flexible output, we want you to be able to output your logs anywhere it makes sense, and in a format that makes them searchable, aggregatable, etc.
2. Simple implementation, it should be really easy to setup and use, and light weight enough to justify using in any app

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
