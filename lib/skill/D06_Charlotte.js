"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var context_1 = require("../core/context");
var skillEvent_1 = require("../core/skillEvent");
var skill = {
    disactivateAt: function (context, state, self) {
        var time = (0, context_1.getCurrentTime)(context);
        var active = self.skill.property.readNumber("active");
        var wait = self.skill.property.readNumber("wait");
        return {
            activeTimeout: time + active * 1000,
            cooldownTimeout: time + (active + wait) * 1000,
        };
    },
    onActivated: function (context, state, self) {
        var timer = self.skill.property.readNumber("timer");
        var evaluate = function (context, state, self) { return (0, skillEvent_1.randomeAccess)(context, state); };
        var time = (0, context_1.getCurrentTime)(context) + timer * 1000;
        return (0, skillEvent_1.enqueueSkillEvent)(context, state, time, {
            denco: self,
            probability: true,
            evaluate: evaluate
        });
    }
};
exports.default = skill;
