import type viewModelClass from "../Classes/viewModelClass";

export default function downloadRows(viewModel: viewModelClass): Record<string, unknown>[] {
  const points = viewModel.plotPoints;
  const rows = new Array<Record<string, unknown>>(points.length);
  for (let i = 0; i < points.length; i++) {
    rows[i] = points[i].table_row;
  }
  return rows;
}
