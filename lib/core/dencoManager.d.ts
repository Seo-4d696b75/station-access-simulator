import { Context } from "./context";
import { Denco, DencoState } from "./denco";
import { StationLink } from "./station";
import { ReadonlyState, UserState } from "./user";
interface DencoLevelStatus extends Denco {
    readonly level: number;
    readonly ap: number;
    readonly maxHp: number;
    readonly nextExp: number;
}
declare class DencoManager {
    data: Map<string, DencoLevelStatus[]>;
    load(data?: string): Promise<void>;
    getDenco(context: Context, numbering: string, level?: number, link?: StationLink[] | number): DencoState;
    getDencoStatus(numbering: string, level: number): DencoLevelStatus | undefined;
    checkLevelup(context: Context, current: ReadonlyState<UserState>): UserState;
}
declare const manager: DencoManager;
export default manager;