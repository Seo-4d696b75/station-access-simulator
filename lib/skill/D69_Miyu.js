"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var __1 = require("..");
var skill = {
    canEvaluate: function (context, state, step, self) {
        // 移動距離1km未満は発動しない?
        return step === "start_access" &&
            self.which === "offense" &&
            state.defense !== undefined &&
            state.offense.user.dailyDistance >= 1.0;
    },
    evaluate: function (context, state, step, self) {
        var dist = state.offense.user.dailyDistance;
        var distMax = self.skill.propertyReader("distMax");
        var expMax = self.skill.propertyReader("expMax");
        var expDist = Math.floor(expMax * Math.min(1.0, dist / distMax));
        var expFixed = dist >= distMax ? self.skill.propertyReader("expFixed") : 0;
        var accessDenco = (0, __1.getAccessDenco)(state, "offense");
        accessDenco.exp.skill += expDist;
        if (expFixed > 0) {
            state.offense.formation.forEach(function (d) {
                d.exp.skill += expFixed;
            });
        }
        context.log.log("\u7D4C\u9A13\u5024\u4ED8\u4E0E " + accessDenco.name + ":" + expDist + "(" + dist + "/" + distMax + "km), \u7DE8\u6210\u5185:" + expFixed + "(" + distMax + "km\u4EE5\u4E0A)");
        return state;
    }
};
exports.default = skill;
