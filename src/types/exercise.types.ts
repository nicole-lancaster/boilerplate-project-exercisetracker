import { User } from "./users.types";

export interface Exercise {
  _id: string;
  email?: User["email"];
  description?: string | undefined;
  duration?: number | undefined;
  date?: string | undefined;
}

export interface ExerciseDetails {
  description?: string;
  duration?: number;
  date?: string;
}

export interface FetchExerciseLogsResult {
  email: string;
  count: number;
  _id: User["_id"];
  log: ExerciseLog | string;
}

export type ExerciseLog = ExerciseDetails[] | undefined;
