"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var skill = {
    canEvaluate: function (context, state, step, self) {
        return step === "damage_common" && self.which === "defense";
    },
    evaluate: function (context, state, step, self) {
        var def = self.skillPropertyReader("DEF");
        state.defendPercent += def;
        context.log.log("\u307E\u3060\u307E\u3060\u3053\u3093\u306A\u3082\u3093\u3058\u3083\u306A\u3044\u30BE\u30FC DEF+" + def + "%");
        return state;
    }
};
exports.default = skill;
//# sourceMappingURL=D14_Fubu.js.map