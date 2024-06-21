import { atom, useAtom, useSetAtom } from "jotai";
import { useEffect, useState } from "react";

export type MultiFactorState = {
  email: string;
  password: string;
  tfa_api_token: string;
};

const multiFactorAtom = atom<MultiFactorState | null>(null);

export function useSetMultiFactorState() {
  return useSetAtom(multiFactorAtom);
}

export function usePopMultiFactorState(): MultiFactorState | null {
  const [atom, setAtom] = useAtom(multiFactorAtom);
  const [state, setState] = useState<MultiFactorState | null>(atom);

  useEffect(() => {
    if (atom) {
      setState(atom);
      setAtom(null);
    }
  }, [atom, setAtom]);

  return state;
}
