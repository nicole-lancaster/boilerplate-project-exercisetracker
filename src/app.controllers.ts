import Express from "express"
import { createAndSaveExerciseToDb, createOrSaveUsernameToDb, fetchAllUsers, fetchExerciseLogs } from "./db/database";

export const getHtml = (_request: Express.Request, response: Express.Response) => {
    try {
        return response.status(200).sendFile(`${__dirname}/views/index.html`)
    }
    catch (err) {
        return response.status(500).json({ error: "unable to fetch static files" });
    }
}

export const requestCreateOrSaveUsernameToDb = async (request: Express.Request, response: Express.Response) => {
    const username: string = request.body.username
    try {
        const savedUsernameToDb = await createOrSaveUsernameToDb(username)
        return response.status(200).json(savedUsernameToDb)
    }
    catch (err) {
        return response.status(500).json({ error: "unable to post username" });
    }
}

export const getAllUsers = async (request: Express.Request, response: Express.Response) => {
    try {
        const allUsers = await fetchAllUsers()
        return response.status(200).send(allUsers)
    }
    catch (err) {
        return response.status(500).json({ error: "unable to fetch users" });
    }
}

export const postExerciseById = async (request: Express.Request, response: Express.Response) => {
    const userId = request.params._id
    const { description, duration, date } = request.body
    const durationNum: number = parseFloat(duration)
    try {
        const savedExerciseData = await createAndSaveExerciseToDb(userId, description, durationNum, date)
        return response.status(200).json(savedExerciseData)
    }
    catch (err) {
        console.log("error -->", err)
        return response.status(500).json({ error: "unable to post exercise" });
    }
}

/**
 * from and to are dates in yyyy-mm-dd format. limit is an integer of how many logs to send back.
 * @param request 
 * @param response 
 * @returns 
 */
export const getExerciseLogById = async (request: Express.Request, response: Express.Response) => {
    const userId = request.params._id
    const from = request.query.from as string | undefined
    const to = request.query.to as string | undefined
    const limit = request.query.limit as string | undefined
    try {
        const exerciseLogs = await fetchExerciseLogs(userId, from, to, limit)
        console.log("exerciseLogsReturned -->", exerciseLogs)
        return response.status(200).json(exerciseLogs)
    }
    catch (err) {
        console.log("error -->", err)
        return response.status(500).json({ error: "unable to fetch exercise logs" });
    }
}