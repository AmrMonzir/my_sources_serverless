const Responses = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");
const { withHooks } = require("../common/hooks");

const foldersTable = process.env.foldersTable;
const usersTable = process.env.usersTable;

const handler = async event => {

    if (!event.pathParameters.ID) {
        return Responses._400({ message: 'Missing the user ID from the path' });
    }

    let user_id = event.pathParameters.ID;
    var folder_id = event.body.folder_id;
    var isLocked = event.body.is_locked;
    var isPinned = event.body.is_pinned;
    var name = event.body.name;

    const user = await Dynamo.get(user_id, usersTable);
    if (!user)
        return Responses._400({ "message": "failed to find user" });

    console.log("printing user");
    console.log(user);

    const folder = await Dynamo.get(folder_id, foldersTable);

    if (!folder)
        return Responses._400({ "message": "failed to find folder with that ID" });
    console.log("printing folder");
    console.log(folder);

    if(name !== undefined && name !== undefined)
        await Dynamo.update({
            tableName: foldersTable,
            primaryKey: 'ID',
            primaryKeyValue: folder_id,
            updateKey: `isPinned`,
            updateValue: isPinned
        });

    if (isPinned !== undefined && isPinned !== null)
        await Dynamo.update({
            tableName: foldersTable,
            primaryKey: 'ID',
            primaryKeyValue: folder_id,
            updateKey: `isPinned`,
            updateValue: isPinned
        });

    if (isLocked !== undefined && isLocked !== null)
        await Dynamo.update({
            tableName: foldersTable,
            primaryKey: 'ID',
            primaryKeyValue: folder_id,
            updateKey: `isLocked`,
            updateValue: isLocked
        });
    
    return Responses._200({"message" : "Folder updated successfully"});
};

exports.handler = withHooks(handler);