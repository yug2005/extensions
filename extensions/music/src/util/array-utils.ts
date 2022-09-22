import * as RA from "fp-ts/ReadOnlyNonEmptyArray";

export const removeLast = <T>(arr: RA.ReadonlyNonEmptyArray<T>): ReadonlyArray<T> => {
  return arr.slice(0, -1);
};
