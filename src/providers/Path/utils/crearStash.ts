const slashReg = /^\/*|\/*$/g;

const startReg = /^\/{2,}/g;
const endReg = /\/*$/g;

export const clearSlash = (path: string) => {
  const newPath = path.replaceAll(startReg, "/");
  return newPath.replaceAll(endReg, "");
};
