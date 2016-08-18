import { Log, Logger } from "meteor/useful:logs";
import { chai } from 'meteor/practicalmeteor:chai';

// Note: Arrow function use with Mocha is discouraged.
// (see http://mochajs.org/#arrow-functions)
describe('logs', function() {
  // describe('default logger', function() {
  //   beforeEach(function() {
  //     this._log = console.log;
  //     this.logs = [];
  //     console.log = (...args) => {
  //       this.logs.push(args);
  //     };
  //     this._error = console.error;
  //     this.errors = [];
  //     console.error = (...args) => {
  //       this.errors.push(args);
  //     };
  //     this._warn = console.warn;
  //     this.warns = [];
  //     console.warn = (...args) => {
  //       this.warns.push(args);
  //     };
  //   });
  //   it('should emit logs', function() {
  //     Log.log('test');

  //     chai.assert.deepEqual(this.logs, [['test']]);
  //   });
  //   describe('log levels', function() {
  //     describe('trace', function() {
  //       it('should not emit logs', function() {
  //         Log.trace('test');

  //         chai.assert.deepEqual(this.logs, []);
  //       });
  //     });
  //     describe('debug', function() {
  //       it('should not emit logs', function() {
  //         Log.debug('test');

  //         chai.assert.deepEqual(this.logs, []);
  //       });
  //     });
  //     describe('info', function() {
  //       it('should emit logs to console.log', function() {
  //         Log.info('test');

  //         chai.assert.deepEqual(this.logs, [['info', 'test']]);
  //       });
  //     });
  //     describe('warn', function() {
  //       it('should emit logs to console.warn', function() {
  //         Log.warn('test');

  //         chai.assert.deepEqual(this.warns, [['warn', 'test']]);
  //       });
  //     });
  //     describe('error', function() {
  //       it('should emit logs to console.error', function() {
  //         Log.error('test');

  //         chai.assert.deepEqual(this.errors, [['error', 'test']]);
  //       });
  //     });
  //     describe('fatal', function() {
  //       it('should emit logs to console.error', function() {
  //         Log.fatal('test');

  //         chai.assert.deepEqual(this.errors, [['fatal', 'test']]);
  //       });
  //     });
  //   });
  //   afterEach(function() {
  //     console.log = this._log;
  //     console.error = this._error;
  //     console.warn = this._warn;
  //   });
  // });
  describe('Log.log', function() {
    beforeEach(function() {
      this.logger = new Logger();
      this.logger._detailHandlers = Log._detailHandlers;

      this.logger._messageHandlers = [(m) => this.result = m];
    });

    it('should emit an object', function() {
      this.logger.log("a message");

      chai.assert.isObject(this.result);
    });

    it('should accept multiple arguments', function() {
      this.logger.log("a message", "another message");

      chai.assert.lengthOf(this.result.message, 2);
      chai.assert.deepEqual(this.result.message, ["a message", "another message"]);
    });

    it('should accept objects', function() {
      const theMessage = { field: "a message"};
      this.logger.log(theMessage);

      chai.assert.deepEqual(this.result.message, [theMessage]);
    });

    it('should accept numbers', function() {
      const theMessage = 5;
      this.logger.log(theMessage);

      chai.assert.deepEqual(this.result.message, [theMessage]);
    });

    it('should accept booleans', function() {
      const theMessage = true;
      this.logger.log(theMessage);

      chai.assert.deepEqual(this.result.message, [theMessage]);
    });

    it('should accept regular expressions', function() {
      const theMessage = /x/;
      this.logger.log(theMessage);

      chai.assert.equal(this.result.message[0], theMessage);
    });

    it('should accept null', function() {
      const theMessage = null;
      this.logger.log(theMessage);

      chai.assert.deepEqual(this.result.message, [theMessage]);
    });

    it('should accept undefined', function() {
      const theMessage = undefined;
      this.logger.log(theMessage);

      chai.assert.deepEqual(this.result.message, [theMessage]);
    });
  });
  describe('Log.wrap', function() {
    beforeEach(function() {
      this.logger = new Logger();
      this.result = [];
      this.logger._detailHandlers = Log._detailHandlers;

      this.logger._messageHandlers = [(m) => this.result.push(m)];
    });
    it('should set _parentId', function() {
      this.logger.wrap(() => {
        this.logger.log('inner');
      }, 'outer')();

      chai.assert.equal(this.result[0]._parentId.length, 0);
      chai.assert.equal(this.result[1]._parentId.length, 1);
      chai.assert.equal(this.result[2]._parentId.length, 1);
    });
    it('should deeply set _parentId', function() {
      this.logger.wrap(() => {
        this.logger.wrap(() => {
          this.logger.log('inner');
        }, 'middle')();
      }, 'outer')();

      chai.assert.equal(this.result[0]._parentId.length, 0);
      chai.assert.equal(this.result[1]._parentId.length, 1);
      chai.assert.equal(this.result[2]._parentId.length, 2);
      chai.assert.equal(this.result[3]._parentId.length, 2);
      chai.assert.equal(this.result[4]._parentId.length, 1);
    });
  });
  describe('Log.initialMessage', function() {
    beforeEach(function() {
      this.logger = new Logger();
      this.result = [];
      this.logger._detailHandlers = Log._detailHandlers;
      this.logger.initialMessage('initial');

      this.logger._messageHandlers = [(m) => this.result.push(m)];
    });
    it('should set _parentId of non-wrapped messages', function() {
      this.logger.log('inner');

      chai.assert.equal(this.result[0]._parentId.length, 1);
    });
    it('should deeply set _parentId of wrapped messages', function() {
      this.logger.wrap(() => {
        this.logger.log('inner');
      }, 'outer')();

      chai.assert.equal(this.result[0]._parentId.length, 1);
      chai.assert.equal(this.result[1]._parentId.length, 2);
      chai.assert.equal(this.result[2]._parentId.length, 2);
    });
  });
});
