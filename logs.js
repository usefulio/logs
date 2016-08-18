import { Logger, Message } from "./logger.js";
import { makeDefaultLogger } from "./default-logger.js";

const Log = makeDefaultLogger();

export { Logger, Log, Message, makeDefaultLogger };
export default Log;
