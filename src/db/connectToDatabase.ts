import mongoose, { connect, model } from "mongoose";
import { isEmail } from "validator";
import { config } from "dotenv";
import { User } from "../types/users.types";
import { Exercise } from "../types/exercise.types";
config();

export type EnvVariables = {
  MONGO_URI: string;
  JWT_SECRET: string;
};

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
    exerciseType: { type: String, required: true },
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

export const UserModel = model<User>("User", UserSchema);
export const ExerciseModel = model<Exercise>("Exercise", ExerciseSchema);

connect((process.env as EnvVariables).MONGO_URI);
