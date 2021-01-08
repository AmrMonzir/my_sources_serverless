const Responses = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");
const { withHooks } = require("../common/hooks");

const tableName = process.env.foldersTable;
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

    const userFolders = await Dynamo.query({
        tableName, 
        index: 'user_id',
        queryKey: 'user_id',
        queryValue: ID
    });

    return Responses._200({userFolders});
};

exports.handler = withHooks(handler);