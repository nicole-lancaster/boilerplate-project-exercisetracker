import Express from "express";
import {
  createAndSaveExerciseToDb,
  createOrSaveUsernameToDb,
  fetchAllUsers,
  fetchExerciseLogs,
} from "./db/database";

// Error handlers
// const handleErrors = (error: Error) => {
//   console.log(error.message, error.stack);
//   return error;
// };

export const getHtml = (
  _request: Express.Request,
  response: Express.Response,
) => {
  try {
    console.log("in getHtml function");
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
  console.log("request.body -->", request.body);
  try {
    const savedUserToDb = await createOrSaveUsernameToDb({
      email,
      password,
    });
    console.log("savedUserToDb -->", savedUserToDb);
    return response.status(200).json(savedUserToDb);
  } catch (error: unknown) {
    // handleErrors(error as Error);
    console.error(error);
    return response.status(500).send({ error: "unable to save user" });
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
