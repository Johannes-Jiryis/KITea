export type SemesterName = "Wintersemester" | "Sommersemester";

export type ImportModuleRecord = {
  moduleNumber: string;
  moduleName: string;
  description?: string;
};

export type ImportOptions = {
  semesterName: SemesterName;
  semesterYear: number;
  dryRun: boolean;
  verbose: boolean;
};

export type ImportStats = {
  totalInput: number;
  uniqueInput: number;
  created: number;
  linked: number;
  skipped: number;
  errors: number;
};

export type ImportResult = {
  stats: ImportStats;
  semesterId: string | null;
  semesterLabel: string;
};
