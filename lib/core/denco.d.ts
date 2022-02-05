import { SkillPossess } from "./skill";
import { Film } from "./film";
import { StationLink } from "./station";
import { ReadonlyState } from "./user";
export declare type DencoType = "attacker" | "defender" | "supporter" | "trickster";
export declare type DencoAttribute = "cool" | "heat" | "eco" | "flat";
/**
 * でんこ個体の情報
 * 原則として変化する状態を持たない
 */
export declare type Denco = Readonly<{
    numbering: string;
    name: string;
    type: DencoType;
    attr: DencoAttribute;
}>;
/**
 * 状態を保持する
 */
export interface DencoState extends Denco {
    level: number;
    nextExp: number;
    currentExp: number;
    maxHp: number;
    currentHp: number;
    ap: number;
    skillHolder: SkillPossess;
    film: Film;
    link: StationLink[];
}
export declare function copyDencoState(state: ReadonlyState<DencoState>): DencoState;
export declare function getSkill<S>(denco: {
    skillHolder: {
        type: "possess";
        skill: NonNullable<S>;
    } | {
        type: "not_aquired" | "none";
    };
}): NonNullable<S>;
