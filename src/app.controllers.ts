import Express from "express";
import {
  createAndSaveExerciseToDb,
  createOrSaveUsernameToDb,
  fetchAllUsers,
  fetchExerciseLogs,
} from "./db/database";

interface ValidationError {
  properties: {
    path: string;
    message: string;
  };
}

interface CustomError extends Error {
  errors?: Record<string, ValidationError>;
  code?: number;
}

// handle errors
const handleErrors = (err: CustomError): Record<string, string> => {
  console.log(err.message, err.code);
  const errors: Record<string, string> = { email: "", password: "" };

  // duplicate email error
  if (err.code === 11000) {
    errors.email = "email is already registered";
    return errors;
  }

  // validation errors
  if (err.message.includes("User validation failed") && err.errors) {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message;
    });
  }

  return errors;
};

export const getHtml = (
  _request: Express.Request,
  response: Express.Response,
) => {
  try {
    return response.status(200).sendFile(`${__dirname}/views/index.html`);
  } catch (err) {
    return response.status(500).json({ error: "unable to fetch static files" });
  }
};

export const requestCreateOrSaveUsernameToDb = async (
  request: Express.Request,
  response: Express.Response,
) => {
  const { email, password } = request.body;
  try {
    const savedUserToDb = await createOrSaveUsernameToDb({
      email,
      password,
    });
    return response.status(200).json(savedUserToDb);
  } catch (err: unknown) {
    const errors = handleErrors(err as Error);
    return response.status(500).json({ errors });
  }
};

export const getAllUsers = async (
  request: Express.Request,
  response: Express.Response,
) => {
  try {
    const allUsers = await fetchAllUsers();
    return response.status(200).send(allUsers);
  } catch (err) {
    return response.status(500).json({ error: "unable to fetch users" });
  }
};

export const postExerciseById = async (
  request: Express.Request,
  response: Express.Response,
) => {
  const userId = request.params._id;
  const { description, duration, date } = request.body;
  const durationNum: number = parseFloat(duration);
  try {
    const savedExerciseData = await createAndSaveExerciseToDb(
      userId,
      description,
      durationNum,
      date,
    );
    return response.status(200).json(savedExerciseData);
  } catch (err) {
    console.log("error -->", err);
    return response.status(500).json({ error: "unable to post exercise" });
  }
};

export const getExerciseLogById = async (
  request: Express.Request,
  response: Express.Response,
) => {
  const userId = request.params._id;
  const from = request.query.from as string | undefined;
  const to = request.query.to as string | undefined;
  const limit = request.query.limit as string | undefined;
  try {
    const exerciseLogs = await fetchExerciseLogs(userId, from, to, limit);
    return response.status(200).json(exerciseLogs);
  } catch (err) {
    console.log("error -->", err);
    return response
      .status(500)
      .json({ error: "unable to fetch exercise logs" });
  }
};
