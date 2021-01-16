const Responses = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");
const { withHooks } = require("../common/hooks");

const usersTable = process.env.usersTable;

const handler = async event => {
    console.log('event', event);

    if(!event.pathParameters || !event.pathParameters.ID){
        //failed without an ID
        return Responses._400({message: 'Missing the id from the path'});
    }

    let ID = event.pathParameters.ID;
    const user = await Dynamo.get(ID, usersTable);

    if(user){
        //return the data
        return Responses._200(user);
    }

    //failed as ID was not in the data
    return Responses._400({message : 'No ID in data'});
};

exports.handler = withHooks(handler);
