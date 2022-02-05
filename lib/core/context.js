"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.getCurrentTime = exports.fixClock = exports.setClock = exports.initContext = void 0;
var seedrandom_1 = __importDefault(require("seedrandom"));
function initContext(type, seed, console) {
    if (type === void 0) { type = "test"; }
    if (seed === void 0) { seed = "test"; }
    if (console === void 0) { console = true; }
    return {
        log: new Logger(type, console),
        random: Object.assign((0, seedrandom_1.default)(seed), { mode: "normal" }),
        clock: "now"
    };
}
exports.initContext = initContext;
function setClock(context, time) {
    return __assign(__assign({}, context), { clock: time !== null && time !== void 0 ? time : "now" });
}
exports.setClock = setClock;
/**
 * `getCurrentTime`が返す現在時刻の値で固定する
 * @param context clock
 * @returns 現在時刻で`clock`で固定した新しいcontext 他の状態は同じオブジェクトへの参照を維持する
 */
function fixClock(context) {
    return __assign(__assign({}, context), { clock: getCurrentTime(context) });
}
exports.fixClock = fixClock;
/**
 * 現在時刻を取得する
 * @param context clockの値に従って`Date.now()`もしくは固定された時刻を参照する
 * @returns unix time [ms]
 */
function getCurrentTime(context) {
    return context.clock === "now" ? Date.now() : context.clock;
}
exports.getCurrentTime = getCurrentTime;
/**
 * Contextの下で実行された処理のログを記録する
 */
var Logger = /** @class */ (function () {
    function Logger(type, writeConsole) {
        if (writeConsole === void 0) { writeConsole = true; }
        this.logs = [];
        this.type = type;
        this.time = Date.now();
        this.writeConsole = writeConsole;
    }
    Logger.prototype.toString = function () {
        var str = "";
        str += "========================\n";
        str += "type: " + this.type + "\n";
        str += "time: " + new Date(this.time).toTimeString() + "\n";
        str += "------------------------\n";
        this.logs.forEach(function (log) {
            str += "[" + log.tag + "] " + log.message + "\n";
        });
        str += "========================";
        return str;
    };
    Logger.prototype.appendMessage = function (tag, message) {
        this.logs.push({
            tag: tag,
            message: message
        });
        if (this.writeConsole) {
            if (tag === LogTag.LOG) {
                console.log(message);
            }
            else if (tag === LogTag.WARN) {
                console.warn(message);
            }
            else if (tag === LogTag.ERR) {
                console.error(message);
            }
        }
    };
    Logger.prototype.log = function (message) {
        this.appendMessage(LogTag.LOG, message);
    };
    Logger.prototype.warn = function (message) {
        this.appendMessage(LogTag.WARN, message);
    };
    Logger.prototype.error = function (message) {
        this.appendMessage(LogTag.ERR, message);
        throw Error(message);
    };
    return Logger;
}());
exports.Logger = Logger;
var LogTag;
(function (LogTag) {
    LogTag["LOG"] = "L";
    LogTag["WARN"] = "W";
    LogTag["ERR"] = "E";
})(LogTag || (LogTag = {}));
//# sourceMappingURL=context.js.map