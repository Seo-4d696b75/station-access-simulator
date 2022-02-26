import { SkillHolder, SkillLogic, SkillStateTransition } from "./skill";
interface SkillProperty {
    name: string;
    skillLevel: number;
    dencoLevel: number;
    property: Map<string, number>;
}
/**
 * スキルのレベルに応じたプロパティを参照する
 *
 * see `src/data/skill.json`
 * @param key key値 jsonのkey-valueに対応
 * @param defaultValue 指定したkeyに対するvalueが無い場合のデフォルト値
 * @throws 指定したkeyに対するvalueが無く、デフォルト値も指定が無い場合
 */
export declare type SkillPropertyReader = (key: string, defaultValue?: number) => number;
interface SkillDataset {
    numbering: string;
    moduleName: string;
    skill: SkillLogic;
    transition: SkillStateTransition;
    evaluateInPink: boolean;
    skillProperties: SkillProperty[];
    skillDefaultProperties: Map<string, number>;
}
export declare class SkillManager {
    map: Map<string, SkillDataset>;
    load(data?: string): Promise<void>;
    clear(): void;
    getSkill(numbering: string, level: number): SkillHolder;
    readSkillProperty(numbering: string, level: number): SkillProperty | null;
}
declare const manager: SkillManager;
export default manager;
