import express from "express";
import cors from "cors";
import { requestCreateOrSaveUsernameToDb, getHtml, getAllUsers, postExerciseById, getExerciseLogById } from "./app.controllers";
export const app = express();

app.use(cors())
app.use("/public", express.static('public'))
app.use(express.urlencoded({ extended: true }));

app.get('/', getHtml);
app.post('/api/users', requestCreateOrSaveUsernameToDb)
app.get('/api/users', getAllUsers)
app.post('/api/users/:_id/exercises', postExerciseById)
app.get('/api/users/:_id/logs', getExerciseLogById)
// GET /api/users/:_id/logs?from=<yyyy-mm-dd>&to=<yyyy-mm-dd&limit=<num>