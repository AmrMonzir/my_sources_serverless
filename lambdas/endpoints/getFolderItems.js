const Responses = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");
const { withHooks } = require("../common/hooks");

const foldersTable = process.env.foldersTable;
const usersTable = process.env.usersTable;
const itemsTable = process.env.itemsTable;

const handler = async event => {

    if (!event.pathParameters.ID) {
        //failed without an ID
        return Responses._400({ message: 'Missing the folder id from the path' });
    }

    // have user id here
    let user_id = event.pathParameters.ID;

    const startKey = event.body.startKey;

    const folder = await Dynamo.get(folder_id, foldersTable);
    const user = await Dynamo.get(user_id, usersTable);

    if (!folder || !user) {
        return Responses._404({ message: 'Failed to find folder or user with that ID' });
    }

    console.log(folder);
    console.log(user);


    var response = await Dynamo.query({
        tableName: itemsTable,
        index: "fid_cat",
        queryKey: "fid_cat",
        queryValue: folder.folder_id + folder.category,
        startKey: startKey,
    });

    return Responses._200({ "items": response.items, "lastEvaluatedKey": response.LastEvaluatedKey });
};

exports.handler = withHooks(handler);