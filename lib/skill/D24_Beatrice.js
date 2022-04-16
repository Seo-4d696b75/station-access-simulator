"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var access_1 = require("../core/access");
var context_1 = require("../core/context");
var skill = {
    canEvaluate: function (context, state, step, self) {
        if (step === "damage_common" && self.who === "defense") {
            var offense = (0, access_1.getAccessDenco)(state, "offense");
            return offense.ap > self.ap;
        }
        return false;
    },
    evaluate: function (context, state, step, self) {
        var offense = (0, access_1.getAccessDenco)(state, "offense");
        var maxDEF = self.skill.property.readNumber("DEF");
        var def = Math.floor(maxDEF * (offense.ap - self.ap) / offense.ap);
        state.defendPercent += def;
        context.log.log("DEF:" + def + "% = Max:" + maxDEF + "% * (offenseAP:" + offense.ap + " - selfAP:" + self.ap + ") / " + offense.ap);
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
