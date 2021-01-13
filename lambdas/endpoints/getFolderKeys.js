const Responses = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");
const { withHooks } = require("../common/hooks");

const tableName = process.env.foldersTable;

const handler = async event => {

    if (!event.pathParameters.ID) {
        //failed without an ID
        return Responses._400({ message: 'Missing the folder id from the path' });
    }

    // have user id here
    let folder_id = event.pathParameters.ID;

    var allKeys = [];

    const folder = await Dynamo.get(folder_id, tableName);

    if (!folder) {
        return Responses._404({ message: 'Failed to find folder with that ID' });
    }

    console.log(folder);

    folder.content.thumbnails.forEach(element => {
        allKeys.push(element);
    });

    return Responses._200(allKeys);
};

exports.handler = withHooks(handler);