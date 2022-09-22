import { pipe } from "fp-ts/lib/function";
import { contramap } from "fp-ts/lib/Ord";
import * as S from "fp-ts/string";

interface Named {
  name: string;
}

export const sortByName = pipe(
  S.Ord,
  contramap((s: Named) => s.name)
);
