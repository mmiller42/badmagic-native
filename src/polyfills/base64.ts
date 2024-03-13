import { decode, encode } from "base-64";

global.btoa = encode;
global.atob = decode;
