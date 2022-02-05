import { SkillLogic, SkillPossess, SkillStateTransition } from "./skill";
interface SkillProperty {
    name: string;
    skillLevel: number;
    dencoLevel: number;
    property: Map<string, number>;
}
export declare type SkillPropertyReader = (key: string) => number;
interface SkillDataset {
    numbering: string;
    moduleName: string;
    skill: SkillLogic;
    transactionType: SkillStateTransition;
    evaluateInPink: boolean;
    skillProperties: SkillProperty[];
}
export declare class SkillManager {
    map: Map<string, SkillDataset>;
    load(data?: string): Promise<void>;
    getSkill(numbering: string, level: number): SkillPossess;
    readSkillProperty(numbering: string, level: number): SkillProperty | null;
}
declare const manager: SkillManager;
export default manager;
