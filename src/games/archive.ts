import { shallowReactive } from "vue";
interface Row {
  id: string;
  name: string;
  result: string;
  status: string;
  conflict: boolean;
  incoming: boolean;
}
interface ArchiveView {
  open: boolean;
  input: string;
  error: string;
  rows: Row[];
  hasPreview: boolean;
  committing: boolean;
  read?: (value: string) => void;
  chooseFile?: (file: File) => void;
  edit?: () => void;
  confirm?: () => void;
  download?: () => void;
  close?: () => void;
  choice?: (id: string, incoming: boolean) => void;
}
export const archiveView = shallowReactive<ArchiveView>({
  open: false,
  input: "",
  error: "",
  rows: [],
  hasPreview: false,
  committing: false,
});
