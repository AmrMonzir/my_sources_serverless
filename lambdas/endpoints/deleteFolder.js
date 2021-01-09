const Responses = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");
const { withHooks } = require("../common/hooks");

const foldersTable = process.env.foldersTable;
const usersTable = process.env.usersTable;

const handler = async event =>{

    if(!event.pathParameters.ID){
        //failed without an ID
        return Responses._400({message: 'Missing the id from the path'});
    }

    // have user id here
    let ID = event.pathParameters.ID;

    //make sure ID exists in db
    const user = await Dynamo.get(ID, usersTable);

    if (!user) {
        return Responses._404({ message: 'Failed to find user with that ID' });
    }

    var folder_id = event.body.folder_id;
    
    await Dynamo.delete(folder_id, foldersTable);

    return Responses._200({"message": "Success"});
};

exports.handler = withHooks(handler);