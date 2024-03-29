import { copy, getFormation } from "../";
import { assert } from "../core/context";
import { SkillLogic } from "../core/skill";

const KEY = "damage_count_key"

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onAccessComplete: (context, access, self) => {
    if (!self.skill.active) return
    // 基本的にダメージはアクセスでしか発生しない
    // リブート時は逆にカウント減少
    if (self.hpAfter < self.hpBefore && !self.reboot) {
      const current = self.skill.data.readNumber(KEY, 0)
      const max = self.skill.property.readNumber("count_max")
      // 書き込み可能な状態にコピーする
      const next = copy.AccessResult(access)
      const d = getFormation(next, self.which)[self.carIndex]
      assert(d.skill.type === "possess")
      if (current < max) {
        d.skill.data.putNumber(KEY, current + 1)
        context.log.log(`あたるがダメージを受けました 回数:${current} => ${current + 1}`)
      } else {
        d.skill.data.putNumber(KEY, max)
        context.log.log(`あたるがダメージを受けました 回数は既に上限です:${max}`)
      }
      return next
    }
  },
  onDencoReboot(context, state, self) {
    if (!self.skill.active) return
    const current = self.skill.data.readNumber(KEY, 0)
    const decrease = self.skill.property.readNumber("count_decrease")
    const value = Math.max(current - decrease, 0)
    if (value < current) {
      // 書き込み可能な状態にコピーする
      const next = copy.UserState(state)
      const d = next.formation[self.carIndex]
      assert(d.skill.type === "possess")
      d.skill.data.putNumber(KEY, value)
      context.log.log(`あたるがリブートしました 回数:${current} => ${value}`)
      return next
    }
  },
  onAccessDamagePercent: (context, state, self) => {
    if (self.who === "offense") {
      const cnt = self.skill.data.readNumber(KEY, 0)
      const max = self.skill.property.readNumber("count_max")
      const atkUnit = self.skill.property.readNumber("ATK")
      const atk = Math.floor(atkUnit * Math.min(cnt, max))
      return {
        probability: self.skill.property.readNumber("probability", 100),
        type: "damage_atk",
        percent: atk,
      }
    }
  },
}

export default skill