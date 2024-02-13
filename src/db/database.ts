import mongoose, { HydratedDocument, connect, model } from "mongoose";
import { isEmail } from "validator";
import bcrypt from "bcrypt";
import { config } from "dotenv";
config();

export type EnvVariables = {
  MONGO_URI: string;
  JWT_SECRET: string;
};

interface User {
  _id: string;
  email: string;
  password: string;
  token?: string;
  description?: string | undefined;
  duration?: number | undefined;
  date?: string | undefined;
}

interface Exercise {
  _id: string;
  email?: User["email"];
  description?: string | undefined;
  duration?: number | undefined;
  date?: string | undefined;
}

interface ExerciseDetails {
  description?: string;
  duration?: number;
  date?: string;
}

interface FetchExerciseLogsResult {
  email: string;
  count: number;
  _id: User["_id"];
  log: ExerciseLog | string;
}

type ExerciseLog = ExerciseDetails[] | undefined;

const UserSchema = new mongoose.Schema<User>(
  {
    email: {
      type: String,
      required: [true, "Please enter your email address"],
      unique: true,
      lowercase: true,
      validate: [isEmail, "Invalid email"],
    },
    password: {
      type: String,
      required: [true, "Please enter a password"],
      minlength: [8, "Minimum password length is 8 characters"],
    },
    date: { type: String, required: false },
    description: { type: String, required: false },
    duration: { type: Number, required: false },
  },
  { versionKey: false },
);

const ExerciseSchema = new mongoose.Schema<Exercise>(
  {
    email: { type: String, required: true },
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    date: { type: String, required: false },
  },
  { versionKey: false },
);

const UserModel = model<User>("User", UserSchema);
const ExerciseModel = model<Exercise>("Exercise", ExerciseSchema);

connect((process.env as EnvVariables).MONGO_URI);

export const saveNewUserToDb = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  const salt: string = await bcrypt.genSalt();
  const hashedPassword: string = await bcrypt.hash(password, salt);
  const newUser: HydratedDocument<User> = new UserModel({
    email,
    password: hashedPassword,
  });
  const savedUser = await newUser.save();
  return savedUser;
};

export const fetchExistingUser = async ({ email }: { email: string }) => {
  const foundUser: User | null = await UserModel.findOne({ email });
  return foundUser;
};

// returning a list of all saved users
export const fetchAllUsers = async () => {
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
