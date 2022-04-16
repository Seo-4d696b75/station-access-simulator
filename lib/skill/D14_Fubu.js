"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var __1 = require("..");
var skill = {
    canEvaluate: function (context, state, step, self) {
        return step === "damage_common" && self.which === "defense";
    },
    evaluate: function (context, state, step, self) {
        var def = self.skill.property.readNumber("DEF");
        state.defendPercent += def;
        context.log.log("\u308F\u305F\u3057\u306E\u30B9\u30AD\u30EB\u306F\u7DE8\u6210\u5185\u306E\u3067\u3093\u3053\u9054\u306E\u53D7\u3051\u308B\u30C0\u30E1\u30FC\u30B8\u3092\u6E1B\u3089\u3059\u3082\u306E\u3060\u30FC DEF+" + def + "%");
        return state;
    },
    disactivateAt: function (context, state, self) {
        var active = self.skill.property.readNumber("active");
        var wait = self.skill.property.readNumber("wait");
        var now = (0, __1.getCurrentTime)(context);
        return {
            activeTimeout: now + active * 1000,
            cooldownTimeout: now + (active + wait) * 1000
        };
    }
};
exports.default = skill;
