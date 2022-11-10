import { isEqual } from "lodash";
import { SkillHolder } from "..";
import { DencoState } from "../core/denco";
import { copyState, ReadonlyState } from "../core/state";
import { StationLink } from "../core/station";

// DencoStateにはサブクラスが多くあるため、DencoStateに定義されたプロパティだけコピーする関数
export function copyDencoState(state: ReadonlyState<DencoState>): DencoState {
  return {
    numbering: state.numbering,
    name: state.name,
    attr: state.attr,
    type: state.type,
    level: state.level,
    currentHp: state.currentHp,
    maxHp: state.maxHp,
    currentExp: state.currentExp,
    nextExp: state.nextExp,
    ap: state.ap,
    link: state.link.map(e => copyState<StationLink>(e)),
    skill: copyState<SkillHolder>(state.skill),
    film: {
      ...state.film
    },
  }
}

export function toMatchDencoState(
  received: ReadonlyState<DencoState>,
  expected: ReadonlyState<DencoState>,
): jest.CustomMatcherResult {
  // DencoStateの型として比較したい場合において
  // DencoStateにはサブクラスが多くあるため
  // 直接比較するとサブクラスのみ定義されたプロパティの不一致で検証が失敗する場合がある
  const copyReceived = copyDencoState(received)
  const copyExpected = copyDencoState(expected)
  const pass = isEqual(copyReceived, copyExpected)
  const message = pass ?
    "definitely matched as DencoState" :
    "some properties in DencoState not matched"
  return {
    pass: pass,
    message: () => message,
  }
}

declare global {
  namespace jest {
    interface Matchers<R> {
      /**
       * DencoState型として状態の一致を比較する
       * @param expected 
       */
      toMatchDencoState(expected: ReadonlyState<DencoState>): R;
    }

    interface Expect {
      toMatchDencoState: (expected: ReadonlyState<DencoState>) => any;
    }

    interface InverseAsymmetricMatchers {
      toMatchDencoState: (expected: ReadonlyState<DencoState>) => any;
    }
  }
}

expect.extend({ toMatchDencoState })