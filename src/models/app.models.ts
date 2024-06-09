import mongoose, { HydratedDocument } from "mongoose";
import bcrypt from "bcrypt";
import { config } from "dotenv";
import { User, UserDetails, UserSignUpOrLogin } from "../types/users.types";
import { ExerciseModel, UserModel } from "../db/connectToDatabase";
import {
  Exercise,
  ExerciseDetails,
  FetchExerciseLogsResult,
} from "../types/exercise.types";
config();

export const saveNewUserToDb = async ({
  email,
  password,
}: UserSignUpOrLogin) => {
  const salt: string = await bcrypt.genSalt();
  const hashedPassword: string = await bcrypt.hash(password, salt);
  const newUser: HydratedDocument<UserDetails> = new UserModel({
    email,
    password: hashedPassword,
  });
  const savedUser = await newUser.save();
  return savedUser;
};

export const fetchExistingUser = async ({
  email,
}: {
  email: string;
}): Promise<UserDetails | null> => {
  const foundUser: UserDetails | null = await UserModel.findOne({
    email,
  });

  return foundUser;
};

export const fetchAllUsers = async (): Promise<UserDetails[] | null> => {
  const fetchedUsers: User[] = await UserModel.find();
  return fetchedUsers;
};

// adding and saving exercises data based on user ID
export const createAndSaveExerciseToDb = async (
  userId: string,
  description: string,
  durationNum: number,
  date: string,
) => {
  const dateToUse = date ? new Date(date) : new Date();
  const exerciseDetails: ExerciseDetails = {
    description: description,
    duration: durationNum,
    date: dateToUse.toISOString(),
  };

  // finding the user object by their ID
  const newId = new mongoose.Types.ObjectId(userId);
  const user: User | null = await UserModel.findById(newId);

  if (user) {
    user.description = exerciseDetails.description;
    user.duration = exerciseDetails.duration;
    user.date = dateToUse.toDateString();

    const exerciseObjAndUsername = new ExerciseModel({
      email: user.email,
      ...exerciseDetails,
    });
    await exerciseObjAndUsername.save();
    return user;
  } else {
    console.log(`User ${userId} was not found`);
    return;
  }
};

export const fetchExerciseLogs = async (
  userId: string,
  from?: string,
  to?: string,
  limit?: string,
): Promise<FetchExerciseLogsResult | undefined> => {
  const foundId: User | null = await UserModel.findById(userId);

  // using email to find exercises associated with it
  const exerciseQuery: mongoose.FilterQuery<Exercise> = {};
  if (foundId) {
    exerciseQuery.email = foundId.email;
  }

  // if there are request queries for date, add those to the query object
  if (from && to) {
    const fromDateUTCString = new Date(from).toISOString();
    const toDateUTCString = new Date(to).toISOString();
    exerciseQuery.date = { $gte: fromDateUTCString, $lte: toDateUTCString };
  }

  // if there is a limit query, change it to a number
  let limitNumber: number = 9999;
  if (limit) {
    limitNumber = parseFloat(limit);
  }

  // find all exercises in the db that match the email and any date and/or limit queries
  const foundExercises = await ExerciseModel.find(exerciseQuery)
    .limit(limitNumber)
    .exec();

  // map through all found exercises to return only the description, date and duration properties
  const logArray: ExerciseDetails[] | undefined = foundExercises.map(
    (exercise) => {
      const dateObj = exercise.date ? new Date(exercise.date) : undefined;
      return {
        description: exercise.description,
        duration: exercise.duration,
        date: dateObj?.toDateString(),
      };
    },
  );

  const numOfExercises: number = logArray.length;

  //  creating log repsonse object
  const exerciseLog: FetchExerciseLogsResult = {
    email: foundExercises[0]?.email || "no email found",
    count: numOfExercises,
    _id: userId,
    log: logArray.length > 0 ? logArray : [],
  };
  return exerciseLog;
};
