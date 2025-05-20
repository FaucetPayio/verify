export interface ModalState {
  path?: string;
  name?: string;
  breadCrumbs: string[];
  isOpen: boolean;
}

export type SearchParams = Record<string, string[]>;
