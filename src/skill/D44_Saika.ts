import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  evaluate: (context, state, step, self) => {
    // 移動距離3km未満は発動しない?
    const dist = state.offense.user.daily.readDistance(context)
    if (step === "damage_common" &&
      self.who === "offense" &&
      state.defense !== undefined &&
      dist >= 3.0) {
      return (state) => {
        const threshold1 = self.skill.property.readNumber("threshold1")
        const threshold2 = self.skill.property.readNumber("threshold2")
        const atk1 = self.skill.property.readNumber("ATK1")
        const atk2 = self.skill.property.readNumber("ATK2")
        // TODO どこで端数を切り捨てるか？
        const atk = atk1 * Math.floor(Math.min(threshold1, dist))
          + atk2 * Math.floor(Math.max(Math.min(threshold2, dist) - threshold1, 0))
        state.attackPercent += atk
        context.log.log(`マスター、遠出するときはさいかにまかしてね！超頑張っちゃうよ～！ ATK+${atk}%`)
      }
    }
  }
}

export default skill