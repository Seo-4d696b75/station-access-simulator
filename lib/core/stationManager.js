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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var context_1 = require("./context");
var StationManager = /** @class */ (function () {
    function StationManager() {
        this.data = [];
    }
    StationManager.prototype.load = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var list, _a, _i, list_1, e, s;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!data) return [3 /*break*/, 1];
                        _a = JSON.parse(data);
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require("../data/station.json")); }).then(function (r) { return r.default; }).catch(function (e) { return []; })];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        list = _a;
                        if (!Array.isArray(list)) {
                            throw Error("station data root not array");
                        }
                        for (_i = 0, list_1 = list; _i < list_1.length; _i++) {
                            e = list_1[_i];
                            s = {
                                name: e.name,
                                nameKana: e.name_kana,
                                attr: e.attr,
                            };
                            this.data.push(s);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    StationManager.prototype.getRandomStation = function (context, size) {
        if (size === 0)
            return [];
        if (size > this.data.length) {
            context.log.error("データサイズを越えています");
            throw RangeError("random station size > data size");
        }
        var list = shuffle(this.data, context.random, size);
        context.log.log("\u30E9\u30F3\u30C0\u30E0\u306B\u99C5\u3092\u9078\u51FA\uFF1A" + list.map(function (s) { return s.name; }).join(","));
        return list;
    };
    StationManager.prototype.getRandomLink = function (context, size, minLinkSec, maxLinkSec) {
        if (minLinkSec === void 0) { minLinkSec = 10; }
        if (maxLinkSec === void 0) { maxLinkSec = 3600; }
        if (size === 0)
            return [];
        minLinkSec = Math.max(minLinkSec, 1);
        maxLinkSec = Math.max(maxLinkSec, minLinkSec);
        var station = this.getRandomStation(context, size);
        var duration = new Array(size).fill(null)
            .map(function () { return minLinkSec * 1000 + Math.floor((maxLinkSec - minLinkSec) * 1000 * context.random()); })
            .sort().reverse();
        var now = (0, context_1.getCurrentTime)(context);
        return station.map(function (s, idx) {
            var link = __assign(__assign({}, s), { start: now - duration[idx] });
            return link;
        });
    };
    return StationManager;
}());
function shuffle(src, random, size) {
    var dst = Array.from(src);
    for (var i = 0; i < dst.length - 1 && i < size; i++) {
        var j = Math.floor(random() * (dst.length - i)) + i;
        var tmp = dst[i];
        dst[i] = dst[j];
        dst[j] = tmp;
    }
    return dst.slice(0, size);
}
var manager = new StationManager();
exports.default = manager;
//# sourceMappingURL=stationManager.js.map