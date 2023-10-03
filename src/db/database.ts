import mongoose, { HydratedDocument, connect, model } from "mongoose";
import { response } from "express";
require("dotenv").config();

// 1. defining the type (shape) of the env variables
type EnvVariables = {
    MONGO_URI: string;
};

// 2. creating an interface representing a document in MongoDB
interface Username {
    _id: String;
    username: string;
    versionKey: false;
}

interface Exercise {
    _id: Username["_id"]
    username: String,
    description: String;
    duration: Number;
    date?: String
}

interface Log {
    username: String,
    count: Number,
    _id: Username["_id"],
    log: [{
        description: String,
        duration: Number,
        date?: String,
    }]
}

// 3. create a schema corresponding to the document (rows) interface
const usernameSchema = new mongoose.Schema<Username>(
    {
        username: { type: String, required: true },
    },
    { versionKey: false },
);

const exerciseSchema = new mongoose.Schema<Exercise>(
    {
        username: { type: String, required: true },
        description: { type: String, required: true },
        duration: { type: Number, required: true },
        date: { type: String, required: false }
    },
    { versionKey: false },
);

// 4. create a model - this allows you to create instances of your objects, called documents
const Username = model<Username>("Username", usernameSchema);
const Exercise = model<Exercise>("Exercise", exerciseSchema);

// 5. connecting to mongoDB
connect((process.env as EnvVariables).MONGO_URI);

// 6. checking if user inputted url is already in db
export const createOrSaveUsernameToDb = async (username: string) => {
    // 7. if it is, return that one already saved to the user
    const foundUsername = await Username.findOne({ username });
    let savedUsername: Username;
    if (foundUsername) {
        savedUsername = foundUsername;
        return savedUsername
    }
    // 8. otherwise, creating a new instance of a username and saving to db
    else {
        let newUsername: HydratedDocument<Username> = new Username({ username });
        let currentObjId = newUsername._id
        let newObjIdString = currentObjId.toString()
        savedUsername = await newUsername.save();
        const foundNewlySavedUsername = await Username.findOne(
            { username, _id: newObjIdString }
        );
        return foundNewlySavedUsername;
    }
}

// 9. returning a list of all saved users
export const fetchAllUsers = async () => {
    const fetchedUsers: Username[] = await Username.find()
    return fetchedUsers
}

// 10. adding and saving exercises data based on user ID
export const createAndSaveExerciseToDb = async (userId: any, description: string, duration: number, date: string) => {
    try {
        const foundUser: Username | null = await Username.findById(userId)
        if (foundUser && userId !== undefined) {
            let newExercise: HydratedDocument<Exercise> = new Exercise({
                _id: foundUser._id,
                username: foundUser.username,
                description: description,
                duration: duration,
                date: date ? new Date(date).toDateString() : new Date().toDateString()
            })
            let savedExerciseData: Exercise = await newExercise.save()
            return savedExerciseData
        }
        else {
            return response.status(400).send({ msg: "user ID not found" })
        }
    }
    catch (err) {
        return response.status(500).json({ error: "something went wrong" });
    }
}

export const fetchExerciseLogs = async (userId: any, from?: any, to?: any, limit?: any) => {
    try {
        const exerciseQuery: any = { username: userId }
        if (from && to) {
            const fromDate = new Date(from)
            const toDate = new Date(to)
            exerciseQuery.exerciseQuery.date = { $gte: fromDate, $lte: toDate }
        }
        const limitNumber = parseInt(limit)
        if (!isNaN(limitNumber)) {
            exerciseQuery.limit = limitNumber
        }

        const foundExercises = await Exercise.find(exerciseQuery)
        if (foundExercises) {
            const numOfExercises = foundExercises.length;
            let exerciseLog = {
                username: foundExercises[0].username,
                count: numOfExercises,
                _id: foundExercises[0]._id,
                log: foundExercises.map((exercise) => ({
                    description: exercise.description,
                    duration: exercise.duration,
                    date: exercise.date ? exercise.date : new Date().toDateString(),
                })),
            }
            return exerciseLog
        } else {
            return response.status(404).json({ error: "No exercises found" });
        }

    }
    catch (err) {
        return response.status(500).json({ error: "something went wrong" });
    }
}