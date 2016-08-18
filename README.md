# Useful Logs

I built the useful logs package to scratch my own itch. Here's what I wanted in a logs package:

- [x] 1) Logs objects, so that I can insert logs into any kind of db and preserve field name information.
- [x] 2) Logs context information automatically.
- [x] 3) Flexible output for the same reason as #1
- [x] 4) Smart but lightweight processing of log messages, so that I can log something like this: `Log.log(Book)` and output something like this `{ book: { _id: 123 } }`.
- [ ] 5) Pretty console logs for debug
- [ ] 6) Meteor specific version which hooks into meteor methods and subscriptions.
- [x] 7) Easy to extend

# Log

You can use the useful logs package out of the box with no configuration by importing the Log object into your code.

- `Log.log(...messages)` You can use this method exactly the same way you use `console.log` and you'll get exactly the same output.

## Basic configuration

To get real benefit out of the logs package you need to output the additional information which the logs package collects somewhere. To do that call one of these two methods:

- `Log.attachMessageHandler(fn)` Takes a handler function which will be called with every message logged. The handler will be wrapped in a try catch, but it's best if you write something simple that's not likely to fail and doesn't have performance issues, this method could be called a lot.
- `Log.logMessagesToDB(collection)` Takes a mongo collection and inserts log messages into the collection. Messages are batched and inserted either 100 at a time or once per second (whichever is sooner). Internally this uses `Log.attachMessageHandler` so read the source if you want to know how to write your own handler.

## Logging Context

One of the big benefits of using the logs package is recording the context of log messages. The easiest way to do this is using the `Log.wrap` method:

- `Log.wrap(fn, message, onerror)` Takes a function and returns a function which wraps the execution of that function with logging statements.
    + `fn` Any function.
    + `message` A message which details what `fn` is doing, for example in the case of a meteor method you might use the name of the method.
    + `onerror` Controls the behavior of `Log.wrap`'s try/catch.
        * If `onerror === "catch"` than the returned function will catch, log, and swallow any errors thrown by `fn`.
        * If `onerror` is a function, than the returned function will catch and pass to `onerror` any error throw by `fn`.
        * Otherwise the returned function will catch, log, and throw any errors thrown by `fn`.
    + Return value is a function which will emit logs before & after execution of `fn`.
- `Log.wrapAsync` **Not Implemented** Should work like `Log.wrap` but for asyncronous functions. Should this function automatically call `Meteor.wrapAsync`?

You can also use the `Log.logWithOptions` method to define your own custom metadata to be logged.

- `Log.logWithOptions(messages, options)` Like `Log.log` but automatically extends the log message with additional infomation contained in options. It is recommended that you use `Log.log` or `Log.attachDetailHandler` instead of calling this method, otherwise you risk outputing log messages which are badly formatted.

<!-- Finally, don't forget to use `Log.attachMetadataHandler` to log additional metadata which might be available to your application. For example in meteor it is relatively easy to get the current userId. -->

## Better log messages

Another big benefit of using the logs package is better log messages. When you use useful:logs you're encouraged to do things like this: `Log.log("Book checked out", book, library, user)` where book, library and user are each objects of a type you frequently pass around in your application. Rather than log the entirety of each object, you'll want to call `Log.attachDetailHandler` to strip each object down to it's identifying parts.

- `Log.attachDetailHandler(handler)` - Takes a function and runs that function against all incoming messages, each function is actually run multiple times against a given log message, once for each argument passed to `Log.log`.

An example
```js
Log.attachDetailHandler((detail, message) => {
    if (detail instanceof User) {
        // We want to log minimal details about the book
        message.user = {
            _id: detail._id,
            name: detail.profile && detail.profile.name || "",
        };
        // Return true to indicate that the detail should not be added
        // the logged message will look something like this:
        // {
        //   message: [],
        //   user: {
        //     _id: 123,
        //     name: "Joe Smith",
        //   },
        // }
        return true;
    }
    if (detail && detail._id) {
        // Return an object which will be logged instead of detail
        // The logged message will look something like this:
        // {
        //   message: [{ _id: 123 }],
        // }
        return { _id: detail._id, name: detail.name || "" };
    }
    // Indicate that the logger should handle this in the default way
    // The logged message might look something like this:
    // {
    //   message: ["Book checked out"],
    // }
    return false;
});
```

For each of the code paths above I've indicated what the message might look like if the code followed that path, however the real beauty of the logs package shows when you log multiple arguments. Here's what that might look like:

`Log.log("Book checked out", book, user)`

```js
{
    message: ["Book checked out", { _id: "123", "How to Cook" }],
    user: {
        _id: "123",
        name: "Joe Smith",
    },
}
```

## Output format

By default we output your message arguments to the console, without doing any formatting. This is deliberate, it keeps us from breaking anything and lets you simply swap out the useful logs package for any console log statements.

But once you start outputing those log messages somewhere useful, here's how they'll look:

```js
let message;
Log.attachMessageHandler((m) => message = m);
Log.warn("Error downloading from external api", response.statusCode);
assert.deepEqual(message, {
    // every message is an instance of Message, we use this in our default detailHandler to keep away circular references and ensure we only parse flat data structures.
    
    // every message has a unique id
    _id: Random.id(),

    // by default every argument you pass to Log.log will show up in this array
    // the default logger also adds a custom string when you log to Log.trace, Log.debug, Log.warn, Log.error, etc.
    message: ["warn", "Error downloading from external api", "403"],

    // the level field is added when you call Log.warn, Log.error, etc.
    // you can also add it explicitely by calling Log.logWithOptions(messages, { level: 40 })
    level: 40,

    // every message has a timestamp which is generated when the message was
    // created
    timestamp: Date.now(),
});
Log.debug("Downloaded from external api", { url: url });
assert.deepEqual(message, {
    _id: Random.id(),

    // because no detail handler parsed out the url object it is here in the message array.
    message: ["Downloaded from external api", { url: "http://api.example.com" }],

    timestamp: Date.now(),
})
```

## Best Practices

1. Log more and then pare down your logs using detail handlers
2. Use detail handlers to add descriptive info to your own models and other javascript classes which you can reliably identify in code. It might be harder to do later.
3. Pick a detail handler style and stick to it, here are several that I favor:

        ```js
        // This handler transforms the detail object into a plain js object which identifies the detail object with it's by wrapping it in an object and using the key as the descriptor.
        Log.attachDetailHandler((detail) => {
            if (detail instanceof Book) {
                return {
                    book: {
                        _id: book._id,
                    }
                };
            }
        })

        // An advantage of this style of detail handler is that messages are logged to the console by default:
        Log.log(new Book({ _id: 123 }));
        assert.deepEqual(message, {
            _id: Random.id(),
            message: [{ book: { _id: 123 } }],
            timestamp: Date.now(),
        });
        // console log reads something like this, depending on the logger output
        // -> { book: { _id: 123 } }
        ```

        ```js
        // Very similar to the previous handler, but we use an _typeName property instead of an object key to hold the descriptive type name.
        Log.attachDetailHandler((detail) => {
            if (detail instanceof Book) {
                return {
                    _id: book._id,
                    _typeName: "book",
                };
            }
        });

        // Again, this detail get's logged in the message property which means it get's logged to the console by default
        Log.log(new Book({ _id: 123 }));
        assert.deepEqual(message, {
            _id: Random.id(),
            message: [{ _id: 123, _typeName: "book" }],
            timestamp: Date.now(),
        });
        // console log reads something like this, depending on the logger output
        // -> { _id: 123, _typeName: "book" }
        ```

        ```js
        // A more sofisticated logger logs details to the message object directly, there are a few more details you have to think about when you do it this way, but the payoff can be in a better formatted log message for querying
        Log.attachDetailHandler((detail, message) => {
            // we want to check for the presence of an _id field, if we don't have an _id field, than we should render all of the detail, otherwise the logged object would be empty.
            if (detail instanceof Book && detail._id) {
                const loggedFields = _.pick(detail, '_id', 'name');
                
                // it's important that we only directly modify the message if it is a log message, the detail handler can also be called on properties of objects which were logged, in which case we probably don't want to modify those objects and the field name probably already contains descriptive information
                if (message instanceof Message) {
                    message.book = loggedFields;

                    // This will prevent the logger from pushing the book onto the end of the message array
                    return true;
                } else {
                    loggedFields._typeName = "book";

                    // The object we return will be used in place of the original argument passed to Log.log
                    return loggedFields;
                }
            }
        });

        // We should now have a more declarative message style
        Log.warn("Can't publish book, another book shares the same name", bookToPublish, { existingBook, });
        assert.deepEqual(message, {
            _id: Random.id(),
            message: [
                "Can't publish book, another book shares the same name",
                { _id: "123", name: "How to cook", _typeName: "book"},
            ],
            book: {
                _id: "345",
                name: "How to cook",
            },
            timestamp: Date.now(),
        });

        // We should also add a message handler to ensure that all important fields get logged, here's an easy way to do that:
        Log.addMessageHandler((message) => {
            // Remove fields which are either irrelevant (_id) or have already been logged (message, level)
            // We also remove timestamp because it is logged automatically by meteor apps.
            const fieldsToLog = _.omit(message, '_id', 'message', 'timestamp', 'level');

            // If there are no other fields, no need to log additional info
            if (_.keys(fieldsToLog).length) {
                // Here I'm using a utility function available on the logger
                // this api might change.
                Log._logLog(fieldsToLog);
            }
        })        

        // console log reads something like this, depending on the logger output
        // -> "Can't publish book, another book shares the same name" { _id: "123", name: "How to cook", _typeName: "book"}
        // -> { book: { _id: "345", name: "How to cook" } }
        ```

4. Don't define your detail handlers or message handlers on the client. Browsers do a pretty awesome job of formatting your log messages and displaying them.
5. - or -
6. Think carefully about collecting client side logs. A good approach might be to monkey patch the Log.logWithOptions method to always log everything to the console first, to add all of your regular detail handlers and to add a single message handler which sends important log messages to the server for insertion into your logs. Don't forget to:
    - Authenticate users who are submitting logs.
    - Consider accepting logs only from authenticated users.
    - Rate limit client-side log insertion.
    - Log excessive client-side log submission.
    - Mark client side logs as client side logs.
    - Add appropriate metadata, such as the time the message was recieved by the server.
    - Limit the fields which client side logs may set, maybe map other fields to a `clientReportedMetadata` field.
    - Batch log insertion? (Take a look at Log.logMessagesToDB for inspiration)


## There's More!

- `Log` is just an instance of `Logger` with some default configuration which has been set by calling `makeDefaultLogger`
- `Logger` has a very flexible api which you can customize to suit your needs. For example you could override `Log.emptyMessage` to change the way new log messages are created.

