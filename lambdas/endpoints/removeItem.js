const Responses = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");
const { withHooks } = require("../common/hooks");

const foldersTable = process.env.foldersTable;
const usersTable = process.env.usersTable;
const itemsTable = process.env.itemsTable;

const handler = async event => {

    if (!event.pathParameters.ID) {
        //failed without a key
        return Responses._400({ message: 'Missing the user ID from the path' });
    }

    let item_id = event.body.item_id;
    var folder_id = event.body.folder_id;
    var user_id = event.pathParameters.ID;
    var category = event.body.category;
    category = category.toLowerCase().trim();

    var newContent = [];

    if (!folder_id && user_id) {
        //the key is in users table
        const user = await Dynamo.get(user_id, usersTable);
        if (!user)
            return Responses._400({ "message": "Can't find user" });

        var item = await Dynamo.get(item_id, itemsTable);
        if (!item)
            return Responses._400({ "message": "Can't find item to delete" });

        await Dynamo.delete(item_id, itemsTable);

        var categoryContent = user[category];

        console.log(categoryContent);

        categoryContent.forEach(element => {
            if (item_id !== element)
                newContent.push(element);
        });

        //now update users table to reflect the change
        await Dynamo.update({
            tableName: usersTable,
            primaryKey: "ID",
            primaryKeyValue: user_id,
            updateKey: `${category}`,
            updateValue: newContent
        });

    } else if (folder_id) {
        //the key is in folders table
        const folder = await Dynamo.get(folder_id, foldersTable);

        if (!folder)
            return Responses._400({ "message": "Can't find folder" });

        var item = await Dynamo.get(item_id, itemsTable);
        if (!item)
            return Responses._400({ "message": "Can't find item to delete" });

        await Dynamo.delete(item_id, itemsTable);

        var folderContents = folder.contents;

        console.log(folderContents);

        folderContents.forEach(element => {
            if (item_id !== element)
                newContent.push(element);
        });

        //now update folder entry to reflect the change
        await Dynamo.update({
            tableName: foldersTable,
            primaryKey: "ID",
            primaryKeyValue: folder_id,
            updateKey: "contents",
            updateValue: newContent
        });

    } else {
        return Responses._400({ "message": "Unrecognized parameteres provided" });
    }
    return Responses._200({ "message": "Deleted file successfully" });
};

exports.handler = withHooks(handler);