import { getFormation } from "../core/access";
import { triggerSkillAfterAccess } from "../core/event";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  onAccessComplete: (context, access, self) => {
    // 配布対象はアクセスによる経験値・リブートによるリンク経験値
    if (self.who === "offense" || self.reboot) {
      // アクセスによる獲得経験値（アクセス開始時・リンク成功・与ダメージ量相応）
      // スキルによる経験値配布は対象外
      // リブートしたリンクの経験値
      const exp = self.exp.access.total + self.exp.link
      // 配布対象の数
      const formation = getFormation(access, self.which)
      const dstIndices = self.skill.property
        .readNumberArray("exp_index")
        .filter(idx => idx < formation.length)
        .map(idx => formation[idx])
        .filter(d => d.numbering !== self.numbering) // 自身は対象外
        .filter(d => d.currentExp < d.nextExp) // レベルアップの余地があるか
        .map(d => d.carIndex)
      if (exp > 0 && dstIndices.length > 0) {
        // 配布する経験値がある && 配布対象がいる
        return triggerSkillAfterAccess(
          context,
          access,
          self,
          {
            probability: self.skill.property.readNumber("probability", 100),
            type: "skill_event",
            recipe: (state) => {
              const percent = self.skill.property.readNumber("exp_percent")
              const dstExp = Math.floor(exp * percent / 100)
              context.log.log(`配布対象の経験値 exp:${exp} (access:${self.exp.access}, link:${self.exp.link})`)
              dstIndices
                .map(idx => state.formation[idx])
                .forEach(d => {
                  context.log.log(`経験値の配布 ${d.name} exp:${d.currentExp} => ${d.currentExp + dstExp})`)
                  d.currentExp += dstExp
                })
            }
          }
        )
      }
    }
  }
}

export default skill