export interface Alert {
  id: string;
  type: "admission" | "scholarship" | "deadline" | "system";
  title: string;
  description: string;
  date: string;
  read: boolean;
  link?: string;
}

export const matchedPrograms: any[] = [];
export const matchedScholarships: any[] = [];
export const alerts: Alert[] = [];
