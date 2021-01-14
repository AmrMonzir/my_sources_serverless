const Responses = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");
const { withHooks } = require("../common/hooks");

const tableName = process.env.foldersTable;
const usersTable = process.env.usersTable;

const handler = async event => {

    if (!event.pathParameters.ID) {
        //failed without an ID
        return Responses._400({ message: 'Missing the id from the path' });
    }

    // have user id here
    let ID = event.pathParameters.ID;

    //make sure ID exists in db
    const user = await Dynamo.get(ID, usersTable);
    const category = event.body.category;
    const startKey = event.body.startKey;

    if (!user) {
        return Responses._404({ message: 'Failed to find user with that ID' });
    }

    console.log(event.body);
    console.log(category);

    const response = await Dynamo.query({
        tableName,
        index: 'id_cat',
        queryKey: 'id_cat',
        queryValue: ID + category,
        startKey: startKey
    });

    return Responses._200({ "items": response.Items, "lastEvaluatedKey": response.LastEvaluatedKey });
};

exports.handler = withHooks(handler);