"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var context_1 = require("../core/context");
var skill_1 = require("../core/skill");
var skill = {
    canEvaluate: function (context, state, step, self) {
        if (step === "before_access" && state.defense) {
            var all = Array.from(state.offense.formation);
            all.push.apply(all, state.defense.formation);
            var anySupporter = all.some(function (d) {
                return d.type === "supporter" && (0, skill_1.isSkillActive)(d.skill) && !d.skillInvalidated;
            });
            return anySupporter && self.skill.property.readNumber("probability");
        }
        return false;
    },
    evaluate: function (context, state, step, self) {
        var all = Array.from(state.offense.formation);
        if (state.defense) {
            all.push.apply(all, state.defense.formation);
        }
        var target = all.filter(function (d) { return d.type === "supporter" && (0, skill_1.isSkillActive)(d.skill); });
        var names = target.map(function (d) { return d.name; }).join(",");
        target.forEach(function (d) { return d.skillInvalidated = true; });
        context.log.log("\u30B5\u30DD\u30FC\u30BF\u30FC\u306E\u30B9\u30AD\u30EB\u3082\u4F55\u306E\u305D\u306E\u3001\u3067\u3059\u3088\u266A \u7121\u52B9\u5316\uFF1A" + names);
        return state;
    },
    disactivateAt: function (context, state, self) {
        var active = self.skill.property.readNumber("active");
        var wait = self.skill.property.readNumber("wait");
        var now = (0, context_1.getCurrentTime)(context);
        return {
            activeTimeout: now + active * 1000,
            cooldownTimeout: now + (active + wait) * 1000
        };
    }
};
exports.default = skill;
