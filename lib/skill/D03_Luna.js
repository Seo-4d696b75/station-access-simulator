"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var context_1 = require("../core/context");
var skill = {
    canEvaluate: function (context, state, step, self) {
        return step === "damage_common" &&
            self.who === "defense";
    },
    evaluate: function (context, state, step, self) {
        var hour = new Date((0, context_1.getCurrentTime)(context)).getHours();
        if (hour < 6 || hour >= 18) {
            var def = self.skillPropertyReader("DEF_night");
            state.defendPercent += def;
            context.log.log("\u591C\u306F\u3053\u308C\u304B\u3089\u306A\u3093\u3088\uFF5E DEF+" + def + "%");
        }
        else {
            var def = self.skillPropertyReader("DEF_morning");
            state.defendPercent += def;
            context.log.log("\u307E\u3060\u7720\u3044\u3093\u3088\uFF5E DEF" + def + "%");
        }
        return state;
    }
};
exports.default = skill;
//# sourceMappingURL=D03_Luna.js.map