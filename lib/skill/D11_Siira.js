"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var skill = {
    canEvaluate: function (context, state, step, self) {
        if (step === "damage_common" && self.who === "defense") {
            return self.skill.propertyReader("probability");
        }
        return false;
    },
    evaluate: function (context, state, step, self) {
        var def = self.skill.propertyReader("DEF");
        state.defendPercent += def;
        context.log.log("\u308F\u3001\u308F\u305F\u3057\u306E\u30B9\u30AD\u30EB\u3067\u30A2\u30AF\u30BB\u30B9\u3055\u308C\u305F\u6642\u306B\u30C0\u30E1\u30FC\u30B8\u3092\u8EFD\u6E1B\u3067\u304D\u307E\u3059 DEF+" + def + "%");
        return state;
    }
};
exports.default = skill;
