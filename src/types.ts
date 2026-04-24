export interface BudgetEntry {
  id: string;
  no: string;
  tanggal: string;
  uraian: string;
  nilai: number;
  belanja: string; // The category name
  keterangan: string; // This matches the "key" in BUDGET_GROUPS items
}

export type MonthlyData = Record<string, BudgetEntry[]>;

export interface TabConfig {
  id: string;
  label: string;
  icon: string;
  options: string[];
}
