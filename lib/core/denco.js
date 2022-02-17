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
exports.copyDencoState = void 0;
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
        skill: (0, skill_1.copySkillHolder)(state.skill),
        film: __assign({}, state.film),
    };
}
exports.copyDencoState = copyDencoState;
//# sourceMappingURL=denco.js.map