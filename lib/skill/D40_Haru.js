"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var access_1 = require("../core/access");
var skill_1 = require("../core/skill");
var skill = {
    canEvaluate: function (context, state, step, self) {
        if (step === "before_access" && self.who === "offense" && state.defense) {
            var all = __spreadArray(__spreadArray([], state.offense.formation, true), (0, access_1.getDefense)(state).formation, true);
            var anySupporter = all.some(function (d) {
                return d.type === "supporter" && (0, skill_1.isSkillActive)(d.skill) && !d.skillInvalidated;
            });
            return anySupporter && self.skill.property.readNumber("probability");
        }
        return false;
    },
    evaluate: function (context, state, step, self) {
        var all = __spreadArray(__spreadArray([], state.offense.formation, true), (0, access_1.getDefense)(state).formation, true);
        var target = all.filter(function (d) { return d.type === "supporter" && (0, skill_1.isSkillActive)(d.skill); });
        var names = target.map(function (d) { return d.name; }).join(",");
        target.forEach(function (d) { return d.skillInvalidated = true; });
        context.log.log("\u30CF\u30EB\u306F\u3072\u3068\u308A\u3067\u5927\u4E08\u592B\u3060\u3082\u3093\uFF01\uFF01 \u7121\u52B9\u5316\uFF1A" + names);
        return state;
    }
};
exports.default = skill;
