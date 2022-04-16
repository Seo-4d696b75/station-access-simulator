"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var skill = {
    canEvaluate: function (context, state, step, self) {
        if (step === "pink_check" && !state.pinkMode) {
            return self.skill.property.readNumber("probability");
        }
        return false;
    },
    evaluate: function (context, state, step, self) {
        state.pinkMode = true;
        return state;
    }
};
exports.default = skill;
