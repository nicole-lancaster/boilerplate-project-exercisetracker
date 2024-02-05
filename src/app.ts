import express from "express";
import cors from "cors";
import {
  requestCreateOrSaveUsernameToDb,
  getHtml,
  getAllUsers,
  postExerciseById,
  getExerciseLogById,
  readCookies,
  setCookies,
} from "./app.controllers";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
export const app = express();

app.use(cors());
app.use("/public", express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

app.get("/", getHtml);
app.post("/api/users", requestCreateOrSaveUsernameToDb);
app.get("/api/users", getAllUsers);
app.post("/api/users/:_id/exercises", postExerciseById);
app.get("/api/users/:_id/logs", getExerciseLogById);
app.get("/api/setcookies", setCookies);
app.get("/api/readcookies", readCookies);
