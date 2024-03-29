import { DencoState } from "../../core/denco";
import { TypedMap } from "../../core/property";

/**
 * 任意のDEF増加スキルのでんこ
 */
export function getDefPercentDenco(def: number): DencoState {
  return {
    numbering: `test-defense-percent:${def}`,
    name: `test-defense-percent:${def}`,
    fullName: "でんこ",
    firstName: "でんこ",
    type: "supporter",
    attr: "flat",
    level: 50,
    currentExp: 0,
    nextExp: 100000,
    currentHp: 100,
    maxHp: 100,
    film: { type: "none" },
    ap: 100,
    link: [],
    skill: {
      type: "possess",
      transitionType: "always",
      level: 1,
      name: `test-defense-percent:${def}`,
      property: new TypedMap(),
      data: new TypedMap(),
      transition: {
        state: "active",
        data: undefined
      },
      onAccessDamagePercent: (context, state, self) => {
        if (self.which === "defense") {
          return {
            probability: 100,
            type: "damage_def",
            percent: def,
          }
        }
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
    fullName: "でんこ",
    firstName: "でんこ",
    type: "supporter",
    attr: "flat",
    level: 50,
    currentExp: 0,
    nextExp: 100000,
    currentHp: 100,
    maxHp: 100,
    film: { type: "none" },
    ap: 100,
    link: [],
    skill: {
      type: "possess",
      transitionType: "always",
      level: 1,
      name: "test-skill1",
      property: new TypedMap(),
      data: new TypedMap(),
      transition: {
        state: "active",
        data: undefined
      },
      onAccessDamageFixed: (context, state, self) => {
        if (self.which === which) {
          return {
            probability: 100,
            type: "damage_fixed",
            damage: damage
          }
        }
      }
    }
  }
}

export function skillInvalidateDenco(targetNumber: string): DencoState {
  return {
    numbering: "test",
    name: "test",
    fullName: "でんこ",
    firstName: "でんこ",
    type: "trickster",
    attr: "flat",
    level: 50,
    currentExp: 0,
    nextExp: 100000,
    currentHp: 100,
    maxHp: 100,
    film: { type: "none" },
    ap: 100,
    link: [],
    skill: {
      type: "possess",
      transitionType: "always",
      level: 1,
      name: "test-skill1",
      property: new TypedMap(),
      data: new TypedMap(),
      transition: {
        state: "active",
        data: undefined
      },
      onAccessBeforeStart: (context, state, self) => {
        if (state.defense) {
          return {
            probability: 100,
            type: "invalidate_skill",
            isTarget: (d) => d.numbering === targetNumber,
          }
        }
      }
    }
  }
}
