import { DencoState } from "../core/denco"

/**
 * 任意のDEF増加スキルのでんこ
 */
export function getDefPercentDenco(def: number): DencoState {
  return {
    numbering: `test-defense-percent:${def}`,
    name: `test-defense-percent:${def}`,
    type: "supporter",
    attr: "flat",
    level: 50,
    currentExp: 0,
    nextExp: 100000,
    currentHp: 100,
    maxHp: 100,
    film: {},
    ap: 100,
    link: [],
    skill: {
      type: "possess",
      level: 1,
      name: `test-defense-percent:${def}`,
      property: {
        readBoolean: () => false,
        readNumber: () => 0,
        readString: () => "",
        readNumberArray: () => [],
        readStringArray: () => [],
      },
      state: {
        type: "active",
        transition: "always",
        data: undefined
      },
      canEvaluate: (context, state, step, self) => step === "damage_common" && self.which === "defense",
      evaluate: (context, state, step, self) => {
        state.defendPercent += def
        return state
      }
    }
  }
}


/**
 * 固定ダメージ追加スキルのでんこ（ダミー）
 */
export function getFixedDamageDenco(damage: number): DencoState {
  const which = (damage > 0) ? "offense" : "defense"
  return {
    numbering: "test1",
    name: "test1",
    type: "supporter",
    attr: "flat",
    level: 50,
    currentExp: 0,
    nextExp: 100000,
    currentHp: 100,
    maxHp: 100,
    film: {},
    ap: 100,
    link: [],
    skill: {
      type: "possess",
      level: 1,
      name: "test-skill1",
      property: {
        readBoolean: () => false,
        readNumber: () => 0,
        readString: () => "",
        readNumberArray: () => [],
        readStringArray: () => [],
      },
      state: {
        type: "active",
        transition: "always",
        data: undefined
      },
      canEvaluate: (context, state, step, self) => step === "damage_fixed" && self.which === which,
      evaluate: (context, state, step, self) => {
        state.damageFixed += damage
        return state
      }
    }
  }
}