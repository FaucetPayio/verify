import React from "react";

const errorLocalName = "loadError";

const carefulLoader = (
  lazyComponent: Promise<any>,
  attemptsLeft = 5,
): Promise<any> => {
  return new Promise((resolve, reject) => {
    lazyComponent
      .then((module) => {
        localStorage.setItem(errorLocalName, "0");

        if (module.default) {
          resolve(module);
        } else {
          for (let moduleName in module) {
            resolve({ default: module[moduleName] });
          }
        }
      })
      .catch((error) => {
        setTimeout(() => {
          if (attemptsLeft === 1) {
            reject(error);
            const errorNumbers =
              Number(localStorage.getItem(errorLocalName) || 0) + 1;
            localStorage.setItem(errorLocalName, errorNumbers + "");

            if (errorNumbers <= 5) {
              // for disable page reload if something wrong to much times
              window.location.reload();
            }
            return;
          }
          carefulLoader(lazyComponent, attemptsLeft - 1).then(resolve, reject);
        }, 500);
      });
  });
};

/** How to use:
 *
 *  const Page = lazyLoad(() => import("pages/Page"));
 */
export const lazyLoad = (importComponent: () => Promise<any>) =>
  React.lazy(() => carefulLoader(importComponent()));

export default lazyLoad;
