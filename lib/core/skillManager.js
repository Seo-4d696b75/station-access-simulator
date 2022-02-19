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
exports.SkillManager = void 0;
var SkillManager = /** @class */ (function () {
    function SkillManager() {
        this.map = new Map();
    }
    SkillManager.prototype.load = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var list, _a, _loop_1, this_1, _i, list_1, e;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!data) return [3 /*break*/, 1];
                        _a = JSON.parse(data);
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require("../data/skill.json")); }).then(function (o) { return o.default; }).catch(function (e) { return []; })];
                    case 2:
                        _a = _b.sent();
                        _b.label = 3;
                    case 3:
                        list = _a;
                        if (!Array.isArray(list))
                            throw Error("fail to load skill property");
                        _loop_1 = function (e) {
                            var numbering, moduleName, type, properties, logic, defaultValue, map, _c, _d, _e, key, value, dataset;
                            return __generator(this, function (_f) {
                                switch (_f.label) {
                                    case 0:
                                        if (!e.numbering || !e.class || !e.list) {
                                            throw Error("invalid skill lacking some property " + JSON.stringify(e));
                                        }
                                        numbering = e.numbering;
                                        moduleName = e.class;
                                        type = e.type;
                                        properties = e.list.map(function (d) {
                                            var skill = d.skill_level;
                                            var denco = d.denco_level;
                                            var name = d.name;
                                            var values = Object.assign({}, d);
                                            delete values.skill_level;
                                            delete values.denco_level;
                                            delete values.name;
                                            var map = new Map();
                                            for (var _i = 0, _a = Object.entries(values); _i < _a.length; _i++) {
                                                var _b = _a[_i], key = _b[0], value = _b[1];
                                                map.set(key, Number(value));
                                            }
                                            var p = {
                                                name: name,
                                                skillLevel: skill,
                                                dencoLevel: denco,
                                                property: map,
                                            };
                                            return p;
                                        });
                                        properties.sort(function (a, b) { return a.skillLevel - b.skillLevel; });
                                        return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require("../skill/" + moduleName)); }).then(function (o) { return o.default; })
                                                .catch(function () {
                                                console.warn("fail to import skill logic", moduleName);
                                                return {};
                                            })
                                            // default property
                                        ];
                                    case 1:
                                        logic = _f.sent();
                                        defaultValue = Object.assign({}, e);
                                        delete defaultValue.numbering;
                                        delete defaultValue.class;
                                        delete defaultValue.type;
                                        delete defaultValue.list;
                                        delete defaultValue.step;
                                        map = new Map();
                                        for (_c = 0, _d = Object.entries(defaultValue); _c < _d.length; _c++) {
                                            _e = _d[_c], key = _e[0], value = _e[1];
                                            map.set(key, Number(value));
                                        }
                                        dataset = {
                                            numbering: numbering,
                                            moduleName: moduleName,
                                            skill: logic,
                                            skillProperties: properties,
                                            skillDefaultProperties: map,
                                            transition: type,
                                            evaluateInPink: false,
                                        };
                                        this_1.map.set(numbering, dataset);
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _i = 0, list_1 = list;
                        _b.label = 4;
                    case 4:
                        if (!(_i < list_1.length)) return [3 /*break*/, 7];
                        e = list_1[_i];
                        return [5 /*yield**/, _loop_1(e)];
                    case 5:
                        _b.sent();
                        _b.label = 6;
                    case 6:
                        _i++;
                        return [3 /*break*/, 4];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    SkillManager.prototype.clear = function () {
        this.map.clear();
    };
    SkillManager.prototype.getSkill = function (numbering, level) {
        var data = this.map.get(numbering);
        if (data) {
            var idx = data.skillProperties.length - 1;
            while (idx >= 0) {
                if (level >= data.skillProperties[idx].dencoLevel)
                    break;
                idx -= 1;
            }
            if (idx < 0) {
                return {
                    type: "not_acquired",
                };
            }
            else if (idx < data.skillProperties.length) {
                var property_1 = data.skillProperties[idx];
                return __assign({ type: "possess", level: property_1.skillLevel, name: property_1.name, state: {
                        type: "not_init",
                        transition: data.transition,
                        data: undefined,
                    }, evaluateInPink: data.evaluateInPink, propertyReader: function (key, defaultValue) {
                        var value = property_1.property.get(key);
                        if (!value && value !== 0) {
                            value = data.skillDefaultProperties.get(key);
                        }
                        if (!value && value !== 0) {
                            value = defaultValue;
                        }
                        if (!value && value !== 0) {
                            throw new Error("skill property not found. key:" + key);
                        }
                        return value;
                    } }, data.skill);
            }
            else {
                throw new Error("no skill property found for level: " + level + " " + numbering);
            }
        }
        else {
            return {
                type: "none"
            };
        }
    };
    SkillManager.prototype.readSkillProperty = function (numbering, level) {
        var dataset = this.map.get(numbering);
        if (!dataset)
            throw new Error("no skill property found: " + numbering);
        for (var _i = 0, _a = dataset.skillProperties; _i < _a.length; _i++) {
            var property = _a[_i];
            if (level <= property.dencoLevel) {
                return property;
            }
        }
        throw new Error("no skill property found for level: " + level + " " + numbering);
    };
    return SkillManager;
}());
exports.SkillManager = SkillManager;
var manager = new SkillManager();
exports.default = manager;
