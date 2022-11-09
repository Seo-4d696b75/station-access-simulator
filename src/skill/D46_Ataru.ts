import assert from "assert";
import { AccessUserResult } from "../core/access";
import { SkillLogic } from "../core/skill";
import { copyState } from "../core/state";
import { UserState } from "../core/user";

const KEY = "damage_count_key"

const skill: SkillLogic = {
  onAccessComplete: (context, state, self, access) => {
    // 基本的にダメージはアクセスでしか発生しない
    // リブート時は逆にカウント減少
    if (self.hpAfter < self.hpBefore && !self.reboot) {
      const current = self.skill.data.readNumber(KEY, 0)
      const max = self.skill.property.readNumber("count_max")
      // 書き込み可能な状態にコピーする
      const next = copyState<AccessUserResult>(state)
      const d = next.formation[self.carIndex]
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
    const current = self.skill.data.readNumber(KEY, 0)
    const decrease = self.skill.property.readNumber("count_decrease")
    const value = Math.max(current - decrease, 0)
    if (value < current) {
      // 書き込み可能な状態にコピーする
      const next = copyState<UserState>(state)
      const d = next.formation[self.carIndex]
      assert(d.skill.type === "possess")
      d.skill.data.putNumber(KEY, value)
      context.log.log(`あたるがリブートしました 回数:${current} => ${value}`)
      return next
    }
  },
  evaluate: (context, state, step, self) => {
    if (step === "damage_common" && self.who === "offense" && state.defense) {
      return (state) => {
        const cnt = self.skill.data.readNumber(KEY, 0)
        const max = self.skill.property.readNumber("count_max")
        const atkUnit = self.skill.property.readNumber("ATK")
        const atk = Math.floor(atkUnit * Math.min(cnt, max))
        state.attackPercent += atk
        context.log.log(`ボク、攻撃されると悔しくなってパワー上昇するんです。回数：${cnt} ATK+${atk}%`)
      }
    }
  },
  deactivateAt: (context, state, self) => {
    const active = self.skill.property.readNumber("active")
    const wait = self.skill.property.readNumber("wait")
    const now = context.currentTime
    return {
      activeTimeout: now + active * 1000,
      cooldownTimeout: now + (active + wait) * 1000
    }
  }
}

export default skill