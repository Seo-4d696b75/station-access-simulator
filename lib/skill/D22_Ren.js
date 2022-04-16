"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var access_1 = require("../core/access");
var context_1 = require("../core/context");
var skill = {
    canEvaluate: function (context, state, step, self) {
        if (step === "before_access" && self.who === "offense" && state.defense) {
            var defense = (0, access_1.getAccessDenco)(state, "defense");
            var target = self.skill.property.readStringArray("invalidated");
            return target.includes(defense.numbering);
        }
        return false;
    },
    evaluate: function (context, state, step, self) {
        var defense = (0, access_1.getAccessDenco)(state, "defense");
        defense.skillInvalidated = true;
        context.log.log("\u30A6\u30C1\u306E\u30B9\u30AD\u30EB\u306F\u76F8\u624B\u306E\u30B9\u30AD\u30EB\u3092\u7121\u52B9\u5316\u3059\u308B\u3067\u3047\u30FC target:" + defense.name);
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
