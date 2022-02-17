import { AccessSide } from "./access";
import { DencoState } from "./denco";
import { ReadonlyState } from "./user";
export declare type StationAttribute = "eco" | "heat" | "cool" | "unknown";
export interface Station {
    readonly name: string;
    readonly nameKana: string;
    readonly attr: StationAttribute;
}
export interface StationLink extends Station {
    readonly start: number;
}
export interface LinkResult extends StationLink {
    readonly end: number;
    readonly duration: number;
    readonly score: number;
    readonly matchBonus?: number;
}
/**
 * リブートにより手放したリンクすべての結果
 */
export interface LinksResult {
    /**
     * リブートしたタイミング
     */
    readonly time: number;
    /**
     * リブートしてリンクスコア＆経験値が加算される直前の状態
     * リブートしたリンクは解除されている
     */
    readonly denco: ReadonlyState<DencoState>;
    readonly which: AccessSide;
    readonly link: readonly LinkResult[];
    readonly totalScore: number;
    readonly linkScore: number;
    readonly comboBonus: number;
    readonly matchBonus: number;
    readonly matchCnt: number;
    readonly exp: number;
}
