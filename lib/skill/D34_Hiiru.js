"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var skill = {
    canEvaluate: function (context, state, step, self) {
        return step === "probability_check";
    },
    evaluate: function (context, state, step, self) {
        var boost = self.skill.propertyReader("boost");
        context.log.log("\u30C6\u30F3\u30B7\u30E7\u30F3\u4E0A\u3052\u3066\u3044\u3053\u3046\u2191\u2191 boost:" + boost + "%");
        if (self.which === "offense") {
            state.offense.probabilityBoostPercent += boost;
        }
        else if (state.defense) {
            state.defense.probabilityBoostPercent += boost;
        }
        return state;
    },
    evaluateOnEvent: function (context, state, self) {
        var boost = self.skill.propertyReader("boost");
        context.log.log("\u30C6\u30F3\u30B7\u30E7\u30F3\u4E0A\u3052\u3066\u3044\u3053\u3046\u2191\u2191 boost:" + boost + "%");
        state.probabilityBoostPercent += boost;
        return state;
    }
};
exports.default = skill;
//# sourceMappingURL=D34_Hiiru.js.map