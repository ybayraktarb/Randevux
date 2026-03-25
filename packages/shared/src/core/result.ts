export interface AppError {
  message: string
}

export type AppResult<T> =
  | { success: true; data: T }
  | { success: false; error: AppError }

export function ok<T>(data: T): AppResult<T> {
  return { success: true, data }
}

export function fail<T = never>(message: string): AppResult<T> {
  return { success: false, error: { message } }
}
