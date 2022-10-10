import { AccessSideState, AccessState } from "."

export function hasDefense(state: AccessState): state is AccessStateWithDefense {
  return !!state.defense
}

export interface AccessStateWithDefense extends AccessState {
  defense: AccessSideState
}