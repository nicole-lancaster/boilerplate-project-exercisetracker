import Express from "express";
import { EnvVariables } from "../db/connectToDatabase";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { CustomError } from "../types/errors.types";
import {
  createAndSaveExerciseToDb,
  fetchAllUsers,
  fetchExerciseLogs,
  fetchExistingUser,
  saveNewUserToDb,
} from "../models/app.models";
import { UserDetails, UserSignUpOrLogin } from "../types/users.types";

const handleErrors = (err: CustomError): Record<string, string> => {
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
  } catch (error) {
    return response.status(500).json({ error });
  }
};

export const findOrSaveUser = async (
  request: Express.Request<UserSignUpOrLogin>,
  response: Express.Response,
) => {
  const { email, password } = request.body;
  if (!email || !password) {
    return response
      .status(400)
      .json({ message: "Email and password are required" });
  }
  try {
    let user: UserDetails | null = await fetchExistingUser({ email });
    if (user) {
      // if user exists, verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return response.status(401).json({ message: "Invalid credentials" });
      }
      // generate JWT token
      const token: string = createToken(user._id);
      return response.status(200).json({ user, token });
    } else {
      // if user doesn't exist, create new user
      user = await saveNewUserToDb({ email, password });
      if (!user || !user._id) {
        return response.status(400).json({ error: "Signup failed" });
      }
      // generate JWT token
      const token: string = createToken(user._id);
      return response.status(201).json({ user, token });
    }
  } catch (err: unknown) {
    const errors = handleErrors(err as Error);
    return response.status(500).json({ errors });
  }
};

const createToken = (id: string) => {
  return jwt.sign({ id }, (process.env as EnvVariables).JWT_SECRET, {
    expiresIn: 9000,
  });
};

export const getAllUsers = async (
  _request: Express.Request,
  response: Express.Response,
) => {
  try {
    const allUsers = await fetchAllUsers();
    return response.status(200).send(allUsers);
  } catch (error) {
    return response.status(500).json({ error });
  }
};

export const postExerciseById = async (
  request: Express.Request,
  response: Express.Response,
) => {
  const userId = request.params._id;
  const { description, duration, date, exerciseType } = request.body;
  const durationNum: number = parseFloat(duration);
  try {
    const savedExerciseData = await createAndSaveExerciseToDb(
      userId,
      description,
      durationNum,
      date,
      exerciseType,
    );
    return response.status(200).json(savedExerciseData);
  } catch (error) {
    return response.status(500).json({ error });
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
  } catch (error) {
    return response.status(500).json({ error });
  }
};
