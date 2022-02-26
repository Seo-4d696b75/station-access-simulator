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
Object.defineProperty(exports, "__esModule", { value: true });
exports.copyDencoStateTo = exports.copyDencoState = void 0;
var skill_1 = require("./skill");
function copyDencoState(state) {
    return {
        numbering: state.numbering,
        name: state.name,
        attr: state.attr,
        type: state.type,
        level: state.level,
        currentHp: state.currentHp,
        maxHp: state.maxHp,
        currentExp: state.currentExp,
        nextExp: state.nextExp,
        ap: state.ap,
        link: Array.from(state.link),
        skill: (0, skill_1.copySkill)(state.skill),
        film: __assign({}, state.film),
    };
}
exports.copyDencoState = copyDencoState;
function copyDencoStateTo(src, dst) {
    if (src.numbering !== dst.numbering) {
        console.warn("\u7570\u306A\u308B\u3067\u3093\u3053\u9593\u3067\u30B3\u30D4\u30FC\u3057\u3066\u3044\u307E\u3059 " + src.name + " > " + dst.name);
    }
    dst.level = src.level;
    dst.currentHp = src.currentHp;
    dst.maxHp = src.maxHp;
    dst.currentExp = src.currentExp;
    dst.nextExp = src.nextExp;
    dst.ap = src.ap;
    dst.link = Array.from(src.link);
    dst.skill = (0, skill_1.copySkill)(src.skill);
    dst.film = __assign({}, src.film);
}
exports.copyDencoStateTo = copyDencoStateTo;
