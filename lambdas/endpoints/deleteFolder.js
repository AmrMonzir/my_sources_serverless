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

    var items = [];

    var isDone = false;
    while (!isDone) {

        var queryResult = await Dynamo.query({
            tableName: itemsTable,
            index: "fid_cat",
            queryKey: "fid_cat",
            queryValue: folder_id + folder.category,
            attributesToGet: "ID"
        });
        console.log("now printing items list0");
        items.push(queryResult.Items);
        console.log(items);

        if (!queryResult.LastEvaluatedKey)
            isDone = true;
    }

    for (var i = 0; i < items[0].length; i++) {
        var res = await Dynamo.delete(items[0][i].ID, itemsTable);
        console.log("deleted item of id:");
        console.log(items[0][i].ID);
    }

    // items.foreach(async (element) => {
    //     // var eid = element.uid_cat.substring(0, element.uid_cat.indexOf(category));
    // });

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