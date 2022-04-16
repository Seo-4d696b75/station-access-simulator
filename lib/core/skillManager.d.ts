import { SkillHolder, SkillLogic, SkillStateTransition } from "./skill";
interface SkillLevelProperty {
    name: string;
    skillLevel: number;
    dencoLevel: number;
    property: Map<string, any>;
}
/**
 * スキルのレベルに応じたデータを参照する
 *
 * `src/data/skill.json`に定義された各でんこのスキルデータから読み出します
 * 参照されるデータの決定方法
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
 * @see `src/data/skill.json`
 * @param key key値 jsonのkey-valueに対応
 * @param defaultValue 指定したkeyに対するvalueが無い場合のデフォルト値
 * @throws jsonファイルから読み出されたデータ型が一致しない場合・対応するデータが見つからない場合
 */
export declare type SkillPropertyReader<T> = (key: string, defaultValue?: T) => T;
interface SkillPropertyValues {
    number: number;
    string: string;
    boolean: boolean;
    numberArray: number[];
    stringArray: string[];
}
/**
 * スキルに関する各種データへアクセスするインターフェース
 *
 * サポートするデータの型は次の通り
 * - number
 * - string
 * - boolean
 * - number[]
 * - string[]
 */
export declare type SkillProperty = {
    readonly [key in keyof SkillPropertyValues as `read${Capitalize<key>}`]: SkillPropertyReader<SkillPropertyValues[key]>;
};
interface SkillDataset {
    numbering: string;
    moduleName: string;
    skill: SkillLogic;
    transition: SkillStateTransition;
    evaluateInPink: boolean;
    skillProperties: SkillLevelProperty[];
    skillDefaultProperties: Map<string, any>;
}
export declare class SkillManager {
    map: Map<string, SkillDataset>;
    load(data?: string): Promise<void>;
    clear(): void;
    getSkill(numbering: string, level: number): SkillHolder;
    readSkillProperty(numbering: string, level: number): SkillLevelProperty | null;
}
declare const manager: SkillManager;
export default manager;
