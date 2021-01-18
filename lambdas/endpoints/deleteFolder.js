const Responses = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");
const { withHooks } = require("../common/hooks");

const foldersTable = process.env.foldersTable;
const usersTable = process.env.usersTable;
const itemsTable = process.env.itemsTable;

const handler = async event => {

    if (!event.pathParameters.ID) {
        //failed without an ID
        return Responses._400({ message: 'Missing the id from the path' });
    }

    // have user id here
    let ID = event.pathParameters.ID;

    //make sure ID exists in db
    const user = await Dynamo.get(ID, usersTable);

    if (!user) {
        return Responses._404({ message: 'Failed to find user with that ID' });
    }

    var folder_id = event.body.folder_id;

    var folder = await Dynamo.get(folder_id, foldersTable);

    //delete all items that

    //now delete all items from db
    // var contentArray = folder.contents;
    // contentArray.forEach(async (element) => {
    //     await Dynamo.delete(element, itemsTable);
    // });

    var queryResult = await Dynamo.query({
        tableName: itemsTable,
        index: "fid_cat",
        queryKey: "fid_cat",
        queryValue: folder_id + folder.category,
        attrbutesToGet: "uid_cat"
    });

    queryResult.items.foreach(async (element) => {
        var eid = element.uid_cat.substring(0, element.uid_cat.indexOf(category));
        await Dynamo.delete(eid, itemsTable)
    });

    var newSize = user.usedSpace - folder.folder_size;

    var res = await Dynamo.update({
        tableName: usersTable,
        primaryKey: "ID",
        primaryKeyValue: ID,
        updateKey: "usedSpace",
        updateValue: newSize
    });

    await Dynamo.delete(folder_id, foldersTable);

    return Responses._200({ "message": "Successfully delete folder" });
    //TODO delete keys from client side
};

exports.handler = withHooks(handler);