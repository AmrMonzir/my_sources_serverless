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
    const folder_id = event.body.folder_id;
    var limit = event.body.limit;
    const folder = await Dynamo.get(folder_id, foldersTable);
    const user = await Dynamo.get(user_id, usersTable);

    if (!folder || !user) {
        return Responses._404({ message: 'Failed to find folder or user with that ID' });
    }

    if (!limit)
        limit = 10;

    console.log(folder);
    console.log(user);

    const fid_cat = folder_id + folder.category;
    console.log(fid_cat);
    var response = await Dynamo.query({
        tableName: itemsTable,
        index: "fid_cat",
        queryKey: "fid_cat",
        queryValue: fid_cat,
        startKey: startKey,
        limit: limit,
    });

    console.log(response);

    return Responses._200({ "items": response.Items, "lastEvaluatedKey": response.LastEvaluatedKey });
};

exports.handler = withHooks(handler);