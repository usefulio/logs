import { _ } from "meteor/underscore";

// XXX make this an optional dependency
import { Meteor } from "meteor/meteor";
import { Random } from "meteor/random";

const instanceId = Random.id();

class Message {}
class Logger {
  // XXX make this completely cross-browser/platform compatible
  // http://stackoverflow.com/questions/5538972/console-log-apply-not-working-in-ie9
  // http://patik.com/blog/complete-cross-browser-console-log/
  static _logError() {
    // XXX implement this
    console.error.apply(console, arguments);
  }
  static _logWarning() {
    // XXX implement this
    console.warn.apply(console, arguments);
  }
  static _logLog() {
    // XXX implement this
    console.log.apply(console, arguments);
  }
  log(...args) {
    return this.logWithOptions(args);
  }
  error(...args) {
    // STUB, this method is replaced by the default logger.
    return this.logWithOptions(args);
  }
  logWithOptions(messages, options) {
    let message = this.emptyMessage();
    let self = this;

    try {
      if (options && _.isObject(options)) {
        _.extend(message, options || {});
      }

      this.currentId().withValue(message._id, () => {
        _.each(messages, (arg) => this.attachDetail(arg, message));

        return this.emitMessage(message);
      });

      return message._id;
    } catch (e) {
      Logger._logError(
        "Error while processing log message. messageId:",
        message._id
      );
      Logger._logError(e);
    }
  }
  parentId() {
    if (!this._parentId) this._parentId = new Meteor.EnvironmentVariable();
    return this._parentId;
  }
  getParentId() {
    const parentId = this.parentId().getOrNullIfOutsideFiber() || [];
    if (this._rootId) {
      return [this._rootId].concat(parentId);
    }
    return parentId;
  }
  withParentId(id, fn) {
    const existingId = this.parentId().getOrNullIfOutsideFiber();
    const idToSet = (existingId || []).concat(id);

    return this.parentId().withValue(idToSet, fn);
  }
  currentId() {
    if (!this._currentId) this._currentId = new Meteor.EnvironmentVariable();
    return this._currentId;
  }
  wrap(fn, message, onerror) {
    const self = this;
    return function() {
      const messages = _.isArray(message) ? message : [message];
      const parentId = self.log('started', ...messages);

      return self.withParentId(parentId, () => {
        try {
          return fn.apply(this, arguments);
        } catch (e) {
          if (_.isFunction(onerror)) {
            return onerror(e);
          }
          self.error(e);
          if (onerror !== "catch") {
            throw e;
          }
        } finally {
          self.log('ended', ...messages);
        }
      });
    };
  }
  wrapAndRun(fn, message, onerror) {
    return this.wrap(fn, message, onerror)();
  }
  initialMessage(...message) {
    if (this._rootId) message.push({ _rootId: this._rootId });
    return (this._rootId = this.log(...message));
  }
  emptyMessage() {
    const message = new Message();

    message._id = Random.id();
    message._parentId = this.getParentId();
    message._timestamp = new Date();
    message.message = [];

    return message;
  }
  detailHandlers() {
    this._detailHandlers = this._detailHandlers || [];
    return this._detailHandlers;
  }
  attachDetailHandler(handler) {
    // newer handlers go to the top
    this.detailHandlers().unshift(handler);
  }
  attachDetail(arg, message) {
    let detail;
    _.find(this.detailHandlers(), (handler) => {
      detail = handler(arg, message);
      return !!detail;
    });

    if (detail === true) {
      // the handler has directly modified the message,
      // we don't need to do anything
    } else if (detail) {
      // the handler transformed the detail, we need to capture the detail
      message.message.push(detail);
    } else {
      // all non-special arguments are placed, in order, in the message
      // array, to preserve the maximum information possible.
      message.message.push(arg);
    }
  }
  messageHandlers() {
    this._messageHandlers = this._messageHandlers || [];
    return this._messageHandlers;
  }
  attachMessageHandler(handler) {
    this.messageHandlers().push(handler);
  }
  emitMessage(message) {
    _.each(this._messageHandlers, (handler) => {
      try {
        handler(message);
      } catch (e) {
        Logger._logError(
          "Error emitting log message. messageId:",
          this.currentId().getOrNullIfOutsideFiber()
        );
        Logger._logError(e);
      }
    });
  }
}

export { Logger, Message };
export default Logger;
