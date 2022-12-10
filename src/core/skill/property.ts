import { copy } from "../../"
import { DencoState } from "../denco"
import { FilmHolder } from "../film"
import { ReadableProperty } from "../property"
import { ReadonlyState } from "../state"
import { Skill } from "./holder"
import { WithSkill } from "./logic"

/**
 * スキルに関する各種データ（スキルプロパティ）でのアクセス方法を定義します
 * 
 * ## フィルムの補正が影響します！
 * ここから読み出す値は次の状態に影響され変化する場合があります
 * - でんこの保有スキル
 * - スキルのレベル
 * - 着用しているフィルムの補正値（number型のみ）
 * 
 */
export interface SkillProperty extends ReadableProperty {
  /**
   * スキルを保有するでんこが現在着用中のフィルム
   * 
   * このフィルム補正を考慮して値を読み出します
   * {@link ReadableProperty}
   */
  readonly film: ReadonlyState<FilmHolder>
}

export function withSkill<T extends DencoState>(denco: T, skill: Skill, idx: number): WithSkill<T> {
  /*
   ここでの状態のコピーは必須ではないが、
   テストで使うmockの呼び出しが参照でキャプチャーしている
   後続の処理で破壊されるとテストしにくいのでコピーしておく
   */
  // let d = copy.DencoState(denco) Tのコピー方法は知らないので呼び出し側に任せる
  let s = copy.SkillHolder(skill) as Skill
  return {
    ...denco,
    carIndex: idx,
    skill: {
      ...s,
      active: s.transition.state === "active",
      property: new SkillPropertyReader(s.property, copy.FilmHolder(denco.film))
    },
  }
}

/**
 * フィルム補正を考慮してスキルデータを読み出す
 */
export class SkillPropertyReader {
  constructor(base: ReadableProperty, film: FilmHolder) {
    this.base = base
    this.film = film
  }

  base: ReadableProperty
  film: FilmHolder

  readBoolean(key: string, defaultValue?: boolean): boolean {
    return this.base.readBoolean(key, defaultValue)
  }

  readNumber(key: string, defaultValue?: number): number {
    const value = this.base.readNumber(key, defaultValue)
    return this.applyFilm(key, value)
  }

  readString(key: string, defaultValue?: string): string {
    return this.base.readString(key, defaultValue)
  }

  readNumberArray(key: string, defaultValue?: number[]): number[] {
    return this.base.readNumberArray(key, defaultValue)
      .map(value => this.applyFilm(key, value))
  }

  readStringArray(key: string, defaultValue?: string[]): string[] {
    return this.base.readStringArray(key, defaultValue)
  }

  applyFilm(key: string, value: number): number {
    if (this.film.type === "film") {
      const diff = this.film?.skill?.[key]
      if (diff) {
        return value + diff
      }
    }
    return value
  }
}