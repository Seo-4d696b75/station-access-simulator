"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var skill = {
    canEvaluate: function (context, state, step, self) {
        if (step === "damage_common" && self.who === "offense") {
            return self.skill.property.readNumber("probability");
        }
        return false;
    },
    evaluate: function (context, state, step, self) {
        var lower = self.skill.property.readNumber("ATK_lower");
        var upper = self.skill.property.readNumber("ATK_upper");
        var atk = lower + Math.floor((upper - lower) * context.random());
        state.attackPercent += atk;
        context.log.log("\u79C1\u306E\u30B9\u30AD\u30EB\u3063\u3066\u3084\u308B\u6C17\u3067\u30C0\u30E1\u30FC\u30B8\u304C\u5909\u308F\u3063\u3061\u3083\u3046\u3093\u3060\u3063\u3066 ATK" + new Intl.NumberFormat("en-US", { signDisplay: "always" }).format(atk));
        return state;
    }
};
exports.default = skill;
