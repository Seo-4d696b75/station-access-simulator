"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var context_1 = require("../core/context");
var skill = {
    canEvaluate: function (context, state, step, self) {
        return step === "damage_common" && self.which === "offense";
    },
    evaluate: function (context, state, step, self) {
        var atk = self.skill.propertyReader("ATK");
        state.attackPercent += atk;
        context.log.log("\u3079\u3001\u5225\u306B\u3042\u3093\u305F\u306E\u70BA\u3058\u3083\u306A\u3044\u3093\u3060\u304B\u3089\u306D\uFF01 ATK+" + atk + "%");
        return state;
    },
    disactivateAt: function (context, state, self) {
        var active = self.skill.propertyReader("active");
        var wait = self.skill.propertyReader("wait");
        var now = (0, context_1.getCurrentTime)(context);
        return {
            activeTimeout: now + active * 1000,
            cooldownTimeout: now + (active + wait) * 1000
        };
    }
};
exports.default = skill;
//# sourceMappingURL=D05_Reika.js.map