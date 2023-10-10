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
    log?: ExerciseLog;
}

interface ExerciseDetails {
    description?: string;
    duration?: number | undefined;
    date?: string | Date | undefined
}

interface newExerciseObj {
    _id: User["_id"]
    username?: User["username"]
    description?: string | undefined;
    duration?: number | undefined;
    date?: string | Date | undefined
}

interface FetchExerciseLogsResult {
    username: string,
    count: number,
    _id: User["_id"],
    log: ExerciseLog
}

type ExerciseLog = ExerciseDetails[] | undefined;

interface exerciseQuery {
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
    },
    { versionKey: false },
);

const ExerciseSchema = new mongoose.Schema<newExerciseObj>(
    {
        username: { type: String, required: true },
        description: { type: String, required: true },
        duration: { type: Number, required: true },
        date: { type: String, required: false },
    },
    { versionKey: false },
);

// 4. create a model - this allows you to create instances of your objects, called documents
const User = model<User>("Username", UserSchema);
const newExerciseObj = model<newExerciseObj>("Exercise", ExerciseSchema);

// 5. connecting to mongoDB
connect((process.env as EnvVariables).MONGO_URI);

// 6. checking if user inputted url is already in db
export const createOrSaveUsernameToDb = async (username: string) => {
    // 7. if it is, return that one already saved to the user
    const foundUsername = await User.findOne({ username });
    let savedUsername: User;
    if (foundUsername) {
        savedUsername = foundUsername;
        return savedUsername
    }
    // 8. otherwise, creating a new instance of a username and saving to db
    else {
        const newUsername: HydratedDocument<User> = new User({ username });
        const currentObjId = newUsername._id
        const newObjIdString = currentObjId.toString()
        savedUsername = await newUsername.save();
        const foundNewlySavedUsername = await User.findOne(
            { username, _id: newObjIdString }
        );
        return foundNewlySavedUsername;
    }
}

// 9. returning a list of all saved users
export const fetchAllUsers = async () => {
    const fetchedUsers: User[] = await User.find()
    return fetchedUsers
}

// 10. adding and saving exercises data based on user ID
export const createAndSaveExerciseToDb = async (userId: string, description: string, duration: number, date: string) => {
    const exerciseDetails: ExerciseDetails = {
        description: description,
        duration: duration,
        date: date ? new Date(date).toDateString() : new Date().toDateString()
    }
    const user: User | null = await User.findById(
        { _id: userId }
    )

    if (user) {
        const exerciseObjAndUsername: newExerciseObj = {
            username: user.username,
            _id: userId,
            ...exerciseDetails
        }
        return exerciseObjAndUsername
    } else {
        return
    }
}

export const fetchExerciseLogs = async (
    userId: string,
    from?: string,
    to?: string,
    limit?: string
): Promise<FetchExerciseLogsResult | undefined> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const foundId: User | null = await User.findById(userId)

    const exerciseQuery: exerciseQuery = {}
    if (foundId) {
        exerciseQuery.username = foundId.username;
    }

    if (from && to) {
        const fromDate = new Date(from);
        const toDate = new Date(to);
        exerciseQuery.date = { $gte: fromDate, $lte: toDate };
    }
    let limitNumber: number
    if (limit) {
        limitNumber = parseInt(limit);
    } else {
        limitNumber = 9000
    }
    console.log("exerciseQuery --->", exerciseQuery)

    const foundExercises: HydratedDocument<User>[] = await User.find(exerciseQuery).limit(limitNumber).exec()
    console.log("foundExercises -->", foundExercises)

    const numOfExercises: number = foundExercises.length;
    console.log("numOfExercises -->", numOfExercises)

    const logArray: ExerciseDetails[] | undefined = foundExercises ? foundExercises : []

    const exerciseLog: FetchExerciseLogsResult = {
        username: foundExercises[0].username,
        count: numOfExercises >= 1 ? numOfExercises : 0,
        _id: foundExercises[0]._id,
        log: logArray
    };
    console.log("exerciseLog -->", exerciseLog)

    return exerciseLog
};


