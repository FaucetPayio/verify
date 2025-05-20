export const toFixed = (num: number, fixed: number) => {
  var re = new RegExp("^-?\\d+(?:.\\d{0," + (fixed || -1) + "})?");
  const result = num.toString().match(re);

  return result ? result[0] : "";
};
