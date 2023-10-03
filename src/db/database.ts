import mongoose, { HydratedDocument, connect, model } from "mongoose";
import { response } from "express";
import { config } from "dotenv"
config();

// 1. defining the type (shape) of the env variables
type EnvVariables = {
    MONGO_URI: string;
};

// 2. creating an interface representing a document in MongoDB
interface Username {
    _id: string;
    username: string;
    versionKey: false;
}

interface Exercise {
    _id: Username["_id"]
    username: string,
    description: string;
    duration: number;
    date?: string
}

interface Log {
    username: string,
    count: number,
    _id: Username["_id"],
    log: {
        description: string,
        duration: number,
        date?: string,
    }[]
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
        const newUsername: HydratedDocument<Username> = new Username({ username });
        const currentObjId = newUsername._id
        const newObjIdString = currentObjId.toString()
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
export const createAndSaveExerciseToDb = async (userId: string, description: string, duration: number, date: string) => {
    try {
        const foundUser: Username | null = await Username.findById(userId)
        if (foundUser && userId !== undefined) {
            const newExercise: HydratedDocument<Exercise> = new Exercise({
                _id: foundUser._id,
                username: foundUser.username,
                description: description,
                duration: duration,
                date: date ? new Date(date).toDateString() : new Date().toDateString()
            })
            const savedExerciseData: Exercise = await newExercise.save()
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

export const fetchExerciseLogs = async (
    userId: string,
    from?: string,
    to?: string,
    limit?: string
) => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const exerciseQuery: Record<string, any> = { username: userId };

        if (from && to) {
            const fromDate = new Date(from);
            const toDate = new Date(to);
            exerciseQuery.date = { $gte: fromDate, $lte: toDate };
        }

        const limitNumber = parseInt(limit || "", 10);

        if (!isNaN(limitNumber)) {
            const foundExercises = await Exercise.find(exerciseQuery).limit(limitNumber);
            const numOfExercises = foundExercises.length;
            const exerciseLog: Log = {
                username: foundExercises[0].username,
                count: numOfExercises,
                _id: foundExercises[0]._id,
                log: foundExercises.map((exercise) => ({
                    description: exercise.description,
                    duration: exercise.duration,
                    date: exercise.date ? exercise.date : new Date().toDateString(),
                })),
            };

            return exerciseLog;
        } else {
            return response.status(404).json({ error: "No exercises found" });
        }
    } catch (err) {
        return response.status(500).json({ error: "something went wrong" });
    }
};
