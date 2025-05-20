import { objectIsEmpty } from "utils";
import { ExtendedPage, PageData, PagesRoute } from "./type";
import { routes } from ".";

export const createRoute = () => {
  const pagesRoutes: { pathName: string; data: PageData }[] = [];

  const createRouteArray = (
    route: PagesRoute | ExtendedPage,
    currentPath: string,
  ) => {
    Object.entries(route).forEach(([pathName, content]) => {
      if (content.data) {
        pagesRoutes.push({
          pathName: currentPath + pathName,
          data: { ...content.data } as PageData,
        });
      }

      if (!objectIsEmpty(content) && !content.component && !content.redirect) {
        const newPath = currentPath + pathName;

        createRouteArray(
          content,
          newPath + (newPath[newPath.length - 1] !== "/" ? "/" : ""),
        );
      }
    });
  };

  createRouteArray(routes, "");

  return {
    pages: pagesRoutes,
  };
};
