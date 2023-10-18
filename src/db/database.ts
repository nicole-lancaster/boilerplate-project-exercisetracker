import mongoose, { HydratedDocument, connect, model } from "mongoose";
import { config } from "dotenv"
config();

// defining the type (shape) of the env variables
type EnvVariables = {
    MONGO_URI: string;
};

// creating an interface representing a document in MongoDB
interface User {
    _id: string;
    username: string;
    description?: string;
    duration?: number;
    date?: string | Date
    versionKey: false;
}

interface ExerciseDetails {
    description?: string;
    duration?: number;
    date?: string;
}

interface Exercise {
    _id: string;
    username?: User["username"];
    description?: string | undefined;
    duration?: number | undefined;
    date?: string | undefined
}

interface FetchExerciseLogsResult {
    username: string,
    count: number,
    _id: User["_id"],
    log: ExerciseLog | string
}

type ExerciseLog = ExerciseDetails[] | undefined;

// create a schema corresponding to the document (rows) interface
const UserSchema = new mongoose.Schema<User>(
    {
        username: { type: String, required: true },
        description: { type: String, required: false },
        duration: { type: Number, required: false },
        date: { type: String, required: false },
    },
    { versionKey: false },
);

const ExerciseSchema = new mongoose.Schema<Exercise>(
    {
        username: { type: String, required: true },
        description: { type: String, required: true },
        duration: { type: Number, required: true },
        date: { type: String, required: false },
    },
    { versionKey: false },
);

// create a model - this allows you to create instances of your objects, called documents
const UserModel = model<User>("Username", UserSchema);
const ExerciseModel = model<Exercise>("Exercise", ExerciseSchema);

// connecting to mongoDB
connect((process.env as EnvVariables).MONGO_URI);

// checking if username is already in db
export const createOrSaveUsernameToDb = async (username: string) => {
    // if it is, return that that user object to the user
    const foundUser = await UserModel.findOne({ username });
    let savedUser: User;
    if (foundUser) {
        savedUser = foundUser;
        return savedUser
    }
    // otherwise, creating a new instance of a user and saving to db
    else {
        const newUser: HydratedDocument<User> = new UserModel({ username });
        const currentObjId = newUser._id
        const newObjIdString = currentObjId.toString()
        savedUser = await newUser.save();
        const foundNewlySavedUser = await UserModel.findOne(
            { username, _id: newObjIdString }
        );
        return foundNewlySavedUser;
    }
}

// returning a list of all saved users
export const fetchAllUsers = async () => {
    const fetchedUsers: User[] = await UserModel.find()
    return fetchedUsers
}

// adding and saving exercises data based on user ID
export const createAndSaveExerciseToDb = async (userId: string, description: string, durationNum: number, date: string) => {
    const dateToUse = date ? new Date(date) : new Date()
    const exerciseDetails: ExerciseDetails = {
        description: description,
        duration: durationNum,
        date: dateToUse.toISOString()
    }

    // finding the user object by their ID
    const newId = new mongoose.Types.ObjectId(userId);
    const user: User | null = await UserModel.findById(newId)

    if (user) {
        user.description = exerciseDetails.description
        user.duration = exerciseDetails.duration
        user.date = dateToUse.toDateString()

        const exerciseObjAndUsername = new ExerciseModel({
            username: user.username,
            ...exerciseDetails
        })
        await exerciseObjAndUsername.save()
        return user
    } else {
        console.log(`User ${userId} was not found`)
        return
    }
}

export const fetchExerciseLogs = async (
    userId: string,
    from?: string,
    to?: string,
    limit?: string
): Promise<FetchExerciseLogsResult | undefined> => {
    const foundId: User | null = await UserModel.findById(userId)

    // using username to find exercises associated with it
    const exerciseQuery: mongoose.FilterQuery<Exercise> = {}
    if (foundId) {
        exerciseQuery.username = foundId.username;
    }

    // if there are request queries for date, add those to the query object
    if (from && to) {
        const fromDateUTCString = new Date(from).toISOString()
        const toDateUTCString = new Date(to).toISOString()
        exerciseQuery.date = { $gte: fromDateUTCString, $lte: toDateUTCString };
    }

    // if there is a limit query, change it to a number
    let limitNumber: number = 9999
    if (limit) {
        limitNumber = parseFloat(limit);
    }

    // find all exercises in the db that match the username and any date and/or limit queries
    const foundExercises = await ExerciseModel.find(exerciseQuery).limit(limitNumber).exec()

    // map through all found exercises to return only the description, date and duration properties
    const logArray: ExerciseDetails[] | undefined = foundExercises.map((exercise) => {
        const dateObj = exercise.date ? new Date(exercise.date) : undefined
        return {
            description: exercise.description,
            duration: exercise.duration,
            date: dateObj?.toDateString(),
        };
    })

    const numOfExercises: number = logArray.length;

    //  creating log repsonse object
    const exerciseLog: FetchExerciseLogsResult = {
        username: foundExercises[0]?.username || "no username found",
        count: numOfExercises,
        _id: userId,
        log: logArray.length > 0 ? logArray : []
    }
    return exerciseLog
};


