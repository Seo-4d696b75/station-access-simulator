"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var skill = {
    canEvaluate: function (context, state, step, self) {
        if (step === "damage_common" &&
            self.which === "defense" &&
            self.who !== "defense" &&
            state.defense) {
            var defense = state.defense.formation[state.defense.carIndex];
            if (defense.type === "attacker") {
                return self.skill.property.readNumber("probability");
            }
        }
        return false;
    },
    evaluate: function (context, state, step, self) {
        var def = self.skill.property.readNumber("DEF");
        state.defendPercent += def;
        context.log.log("\u308F\u305F\u3057\u306E\u30B9\u30AD\u30EB\u306F\u30A2\u30BF\u30C3\u30AB\u30FC\u3055\u3093\u306E\u53D7\u3051\u308B\u30C0\u30E1\u30FC\u30B8\u3092\u8EFD\u6E1B\u3057\u307E\u3059 DEF+" + def + "%");
        return state;
    }
};
exports.default = skill;
