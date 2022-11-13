import moment from "moment-timezone";
import { getAccessDenco } from "../core/access";
import { isSkillActive, SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  triggerOnAccess: (context, state, step, self) => {
    if (self.who === "defense" && step === "before_access") {
      const offense = getAccessDenco(state, "offense")
      const target = self.skill.property.readStringArray("target")
      // 対象でんこ && スキルがアクティブ && まだ無効化されていない
      // TODO 対象でんこをnumberingで列挙　適宜更新が必要
      if (isSkillActive(offense.skill) && !offense.skillInvalidated && target.includes(offense.numbering)) {
        // 一部の対象は時間帯も判定が必要
        const hour = moment(context.currentTime).hour()
        if (offense.numbering === "15" && (hour < 6 || hour >= 18)) {
          // 15 Ringo は昼間のみ対象
          return
        }
        if (offense.numbering === "30" && 6 <= hour && hour < 18) {
          // 30 Reno は夜間のみ対象
          return
        }
        return (state) => {
          const d = getAccessDenco(state, "offense")
          d.skillInvalidated = true
          context.log.log(`ほこねのいもうとあい？理解くるしむ。だから効かない？ スキルを無効化：${d.name}(${d.numbering})`)
        }
      }
    }
  },
  deactivateAt(context, state, self) {
    const active = self.skill.property.readNumber("active")
    const wait = self.skill.property.readNumber("wait")
    const now = context.currentTime
    return {
      activeTimeout: now + active * 1000,
      cooldownTimeout: now + (active + wait) * 1000,
    }
  },
}

export default skill