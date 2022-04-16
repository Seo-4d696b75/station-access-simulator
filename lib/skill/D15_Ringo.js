"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var __1 = require("..");
var moment_timezone_1 = __importDefault(require("moment-timezone"));
var skill = {
    canEvaluate: function (context, state, step, self) {
        if (step === "damage_common") {
            var hour = (0, moment_timezone_1.default)((0, __1.getCurrentTime)(context)).hour();
            if ((hour < 6 || hour >= 18) && self.who === "defense")
                return true;
            if ((6 <= hour && hour < 18) && self.who === "offense")
                return true;
        }
        return false;
    },
    evaluate: function (context, state, step, self) {
        var hour = (0, moment_timezone_1.default)((0, __1.getCurrentTime)(context)).hour();
        if ((hour < 6 || hour >= 18) && self.who === "defense") {
            var def = self.skill.property.readNumber("DEF");
            state.defendPercent += def;
            context.log.log("\u591C\u66F4\u304B\u3057\u306F\u304A\u808C\u306E\u5927\u6575\u266A DEF " + def + "%");
        }
        if ((6 <= hour && hour < 18) && self.who === "offense") {
            var atk = self.skill.property.readNumber("ATK");
            state.attackPercent += atk;
            context.log.log("\u308A\u3093\u3054\u3061\u3083\u3093\u306F\u57FA\u672C\u65E5\u4E2D\u3060\u3051\u9811\u5F35\u308A\u307E\u3059\u266A ATK +" + atk + "%");
        }
        return state;
    }
};
exports.default = skill;
