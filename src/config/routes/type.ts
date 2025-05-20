import { ComponentType, FC, LazyExoticComponent } from "react";

export interface PageData {
  component?: (() => JSX.Element) | LazyExoticComponent<ComponentType<any>>;
  redirect?: string;
}

export interface ModalProps {
  onClose: () => void;
}

type PageContent = {
  data?: PageData;
};

interface BreadCrumbsPage {
  [path: string]: ExtendedPage;
}

export type ExtendedPage = BreadCrumbsPage | PageContent;

export interface PagesRoute {
  [path: string]: ExtendedPage;
}
