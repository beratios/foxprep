import { randomInt } from "crypto";

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function code(len: number) {
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHA[randomInt(ALPHA.length)];
  return s;
}
export const newCustomerCode = () => `FX-${code(4)}`;
export const newOrderRef = () => `IN-${code(6)}`;
