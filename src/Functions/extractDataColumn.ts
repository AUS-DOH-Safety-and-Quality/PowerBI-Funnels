import type powerbi from "powerbi-visuals-api"
type DataViewValueColumn = powerbi.DataViewValueColumn;
type DataViewValueColumns = powerbi.DataViewValueColumns;
type DataViewCategorical = powerbi.DataViewCategorical;
type DataViewCategoryColumn = powerbi.DataViewCategoryColumn;

type TargetT = number[] | string[] | number | string;

export default function extractDataColumn<T extends TargetT>(inputView: DataViewCategorical,
                                              name: string): T {
  let columnRaw: DataViewValueColumn;
  if (name === "key" || name === "group") {
    const columnRawTmp: DataViewValueColumn[] = (inputView.categories as DataViewCategoryColumn[]).filter(viewColumn => {
      return viewColumn.source.roles ? viewColumn.source.roles[name] : false;
    });
      columnRaw = columnRawTmp[0];
      return <string[]>columnRaw.values as Extract<T, string[]>;
  } else {
    columnRaw = (inputView.values as DataViewValueColumns).filter(viewColumn => {
      return viewColumn.source.roles ? viewColumn.source.roles[name] : false;
    })[0];
    return (columnRaw ? columnRaw.values : null) as T;
  }
}
