import mongoose, { HydratedDocument, connect, model } from "mongoose";
import { config } from "dotenv"
config();

// 1. defining the type (shape) of the env variables
type EnvVariables = {
    MONGO_URI: string;
};

// 2. creating an interface representing a document in MongoDB
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
    date?: string | Date
}

interface Exercise {
    _id: string;
    username?: User["username"];
    description?: string | undefined;
    duration?: number | undefined;
    date?: string | Date | undefined
}

interface FetchExerciseLogsResult {
    username: string,
    count: number,
    _id: User["_id"],
    log: ExerciseLog | string
}

type ExerciseLog = ExerciseDetails[] | undefined;

interface ExerciseQuery {
    username?: string,
    date?: string | Date | object
}

// 3. create a schema corresponding to the document (rows) interface
const UserSchema = new mongoose.Schema<User>(
    {
        username: { type: String, required: true },
        description: { type: String, required: false },
        duration: { type: Number, required: false },
        date: { type: String, required: false },
        // exercises?: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' }],
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

// 4. create a model - this allows you to create instances of your objects, called documents
const UserModel = model<User>("Username", UserSchema);
const ExerciseModel = model<Exercise>("Exercise", ExerciseSchema);

// 5. connecting to mongoDB
connect((process.env as EnvVariables).MONGO_URI);

// 6. checking if user inputted url is already in db
export const createOrSaveUsernameToDb = async (username: string) => {
    // 7. if it is, return that one already saved to the user
    const foundUsername = await UserModel.findOne({ username });
    let savedUsername: User;
    if (foundUsername) {
        savedUsername = foundUsername;
        return savedUsername
    }
    // 8. otherwise, creating a new instance of a username and saving to db
    else {
        const newUsername: HydratedDocument<User> = new UserModel({ username });
        const currentObjId = newUsername._id
        const newObjIdString = currentObjId.toString()
        savedUsername = await newUsername.save();
        const foundNewlySavedUsername = await UserModel.findOne(
            { username, _id: newObjIdString }
        );
        return foundNewlySavedUsername;
    }
}

// 9. returning a list of all saved users
export const fetchAllUsers = async () => {
    const fetchedUsers: User[] = await UserModel.find()
    return fetchedUsers
}

// 10. adding and saving exercises data based on user ID
export const createAndSaveExerciseToDb = async (userId: string, description: string, durationNum: number, date: string) => {
    const exerciseDetails: ExerciseDetails = {
        description: description,
        duration: durationNum,
        date: date ? new Date(date).toDateString() : new Date().toDateString()
    }

    // finding the user object by their ID
    const newId = new mongoose.Types.ObjectId(userId);
    const user: User | null = await UserModel.findById(newId)

    if (user) {
        user.description = exerciseDetails.description
        user.duration = exerciseDetails.duration
        user.date = exerciseDetails.date

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
    const exerciseQuery: ExerciseQuery = {}
    if (foundId) {
        exerciseQuery.username = foundId.username;
    }

    // if there are request queries for date, add those to the query object
    if (from && to) {
        const fromDate = new Date(from).toDateString()
        const toDate = new Date(to).toDateString()
        exerciseQuery.date = { $gte: fromDate, $lte: toDate };
    }

    // if there is a limit query, change it to a number
    let limitNumber: number = 9999
    if (limit) {
        limitNumber = parseFloat(limit);
    }
    console.log("exerciseQuery", exerciseQuery)

    // find all exercises in the db that match the username and any date and/or limit queries
    const foundExercises = await ExerciseModel.find(exerciseQuery).limit(limitNumber).exec()
 
    const logArray: ExerciseDetails[] | undefined = foundExercises.map((exercise) => {
        return {
            description: exercise.description,
            duration: exercise.duration,
            date: exercise.date,
        };
    })

    const numOfExercises: number = logArray.length;

    const exerciseLog: FetchExerciseLogsResult = {
        username: foundExercises[0]?.username || "",
        count: numOfExercises,
        _id: userId,
        log: logArray.length > 0 ? logArray : []
    }
    return exerciseLog
};


