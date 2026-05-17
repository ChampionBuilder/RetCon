export type SerializedBuildSlot = {
  s: number;
  p: number;
  f: string | null;
  a: number[];
};

export type SerializedBuildV1 = {
  v: 1;
  n: string;
  at: number;
  r: number;
  ss: number[];
  it: number;
  t: number[];
  p: SerializedBuildSlot[];
  tp: SerializedBuildSlot[];
  pv?: SerializedBuildSlot[];
  d?: SerializedBuildSlot[];
  st: number[];
  sp: number[][];
  m: number | null;
  c: number;
};

export type SavedBuild = {
  id: string;
  name: string;
  data: string;
  updatedAt: string;
};
