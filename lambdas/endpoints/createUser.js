const Responses = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");
const { withHooks } = require("../common/hooks");

const tableName = process.env.usersTable;


const handler = async event => {

    if(!event.pathParameters.ID){
        //failed without an ID
        return Responses._400({message: 'Missing the id from the path'});
    }

    let ID = event.pathParameters.ID;

    const user = event.body;

    user.ID = ID;
    user.totalAvailableSpace = 512000; //500 MB
    user.usedSpace = 0;

    const newUser = await Dynamo.write(user, tableName);

    if(!newUser){
        return Responses._400({message: "Failed to write user by id"});
    }

    return Responses._200({"message" : `Successfully created user with ID ${ID}`});
};

exports.handler = withHooks(handler);