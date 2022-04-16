"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var access_1 = require("../core/access");
var skill = {
    canEvaluate: function (context, state, step, self) {
        if (step === "after_damage" && self.who === "offense" && state.defense) {
            // 相手がまだリブートしていない & まだ発動していない
            var defense = (0, access_1.getAccessDenco)(state, "defense");
            if (!defense.reboot && !(0, access_1.hasSkillTriggered)(state.offense, self)) {
                return self.skill.property.readNumber("probability");
            }
        }
        return false;
    },
    evaluate: function (context, state, step, self) {
        context.log.log("気合入れて頑張っていこー♪");
        return (0, access_1.repeatAccess)(context, state);
    }
};
exports.default = skill;
