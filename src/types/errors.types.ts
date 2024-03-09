export interface ValidationError {
  properties: {
    path: string;
    message: string;
  };
}

export interface CustomError extends Error {
  errors?: Record<string, ValidationError>;
  code?: number;
}
