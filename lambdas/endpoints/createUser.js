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
    user.phoneNumber = event.body.phoneNumber;
    user.email = event.body.email;
    user.totalAvailableSpace = "500 MB";

    const newUser = await Dynamo.write(user, tableName);

    if(!newUser){
        return Responses._400({message: "Failed to write user by id"});
    }

    return Responses._200(newUser);
};

exports.handler = withHooks(handler);