export const repeat = <G>(
  number: number,
  callBack: (i: number, max: number) => G,
) => {
  const values: G[] = [];

  for (let i = 0; i < number; i++) {
    values.push(callBack(i, number));
  }

  return values;
};
