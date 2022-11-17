import { Film, FilmHolder } from "../film"
import { ReadableProperty, TypedMap } from "../property"

/**
 * スキルに関する各種データへアクセスするインターフェース  
 * 
 * `src/data/skill.json`で定義したデータを読み取る方法を定義します  
 * 読み取る値はスキルレベルに依存して変化する場合があります
 * 
 * ## サポートするデータ型  
 * - number
 * - string
 * - boolean
 * - number[]
 * - string[]
 * 
 * ## 利用例
 * (例)スキルデータ  
 * ```json
 * [
 *   {
 *     "numbering":"1",
 *     "key": "value2",
 *     "list": [
 *       {
 *         "skill_level": 1,
 *         "denco_level": 5,
 *         "key": "value1"
 *       },
 *       {
 *         "skill_level": 2,
 *         "denco_level": 15
 *       }
 *     ]
 *   }
 * ]
 * ```
 * 
 * 各関数`read**`を呼び出すと、
 * 
 * 1. 対応するスキルレベルのJSON Objectを調べて指定した`key`が存在すれば返す  
 *    （例）"skill_level": 1 の場合は "value1"
 * 2. スキルデータ直下のJSON Objectを調べて指定した`key`が存在すれば値を返す  
 *    （例）"skill_level": 2 の場合は "value2"
 * 3. デフォルト値`defaultValue`を返す
 * 
 * **例外の発生**  
 * - 1.2. において指定した`key`で見つかった値が予期した型と異なる場合
 * - 指定した`key`に対する値が存在せず、かつデフォルト値も指定が無い場合
 * 
 * ## フィルムの補正
 * 関数`readNumber, readNumberArray`が実際にアクセス処理中に読み出す値には上記に加え、
 * 着用中のフィルムの補正値が影響します.
 * フィルムの補正値は{@link Film skill}を参照します.
 */
export type SkillProperty = ReadableProperty

/**
 * フィルム補正を考慮してスキルデータを読み出す
 */
export class SkillPropertyReader {
  constructor(base: TypedMap, film: FilmHolder) {
    this.base = base
    if (film.type === "film") {
      this.film = film
    }
  }

  base: TypedMap
  film?: Film

  readBoolean(key: string, defaultValue?: boolean): boolean {
    return this.base.readBoolean(key, defaultValue)
  }

  readNumber(key: string, defaultValue?: number): number {
    const value = this.base.readNumber(key, defaultValue)
    return this.applyFilm(key, value)
  }

  readString(key: string, defaultValue?: string): string {
    return this.readString(key, defaultValue)
  }

  readNumberArray(key: string, defaultValue?: number[]): number[] {
    return this.readNumberArray(key, defaultValue)
      .map(value => this.applyFilm(key, value))
  }

  readStringArray(key: string, defaultValue?: string[]): string[] {
    return this.readStringArray(key, defaultValue)
  }

  applyFilm(key: string, value: number): number {
    const diff = this.film?.skill[key]
    if (diff) {
      return value + diff
    } else {
      return value
    }
  }
}