"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var skill_1 = require("../core/skill");
var skillEvent_1 = require("../core/skillEvent");
var skill = {
    canActivated: function (context, state, self) {
        var idx = state.formation.findIndex(function (d) { return d.currentHp < d.maxHp; });
        return idx >= 0;
    },
    onHourCycle: function (context, state, self) {
        if ((0, skill_1.isSkillActive)(self.skill)) {
            return (0, skillEvent_1.evaluateSkillAtEvent)(context, state, self, true, evaluate);
        }
        else {
            return state;
        }
    }
};
var evaluate = function (context, state, self) {
    var heal = self.skill.propertyReader("heal");
    context.log.log("\u7DE8\u6210\u5185\u306E\u307F\u306A\u3055\u307E\u306EHP\u3092\u56DE\u5FA9\u3044\u305F\u3057\u307E\u3059\u3088\u266A +" + heal + "%");
    state.formation.forEach(function (d) {
        if (d.currentHp < d.maxHp) {
            var v = Math.min(Math.floor(d.currentHp + d.maxHp * heal / 100.0), d.maxHp);
            context.log.log("HP\u306E\u56DE\u5FA9 " + d.name + " " + d.currentHp + " > " + v);
            d.currentHp = v;
        }
    });
    return state;
};
exports.default = skill;
//# sourceMappingURL=D09_Moe.js.map