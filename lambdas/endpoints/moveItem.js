const Responses = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");
const { withHooks } = require("../common/hooks");

const foldersTable = process.env.foldersTable;
const usersTable = process.env.usersTable;
const itemsTable = process.env.itemsTable;

/**
 * inputs: fileKey, source(category or folder), destination 
 * @param {*} event 
 */


// move from category to folder, or from folder to folder

const handler = async event => {

    console.log("got into handler");

    if (!event.pathParameters.ID) {
        //failed without a key
        return Responses._400({ message: 'Missing the file key from the path' });
    }


    let user_id = event.pathParameters.ID;
    let sourceType = event.body.sourceType.toLowerCase().trim();
    var category = event.body.category.toLowerCase().trim();
    let destFolderID = event.body.destFolder;
    let sourceFolderID = event.body.sourceFolder;
    var item_id = event.body.item_id;

    var updatedContent = [];

    var destFolder = await Dynamo.get(destFolderID, foldersTable);

    if (!destFolder) {
        return Responses._400({ "message": "can't find folder in db" });
    }
    if (destFolder.user_id !== user_id) {
        return Responses._400({ "message": "can't move to a different user's folder" });
    }

    var isFound = false;

    if (sourceType === "category") {
        var user = await Dynamo.get(user_id, usersTable);
        var item = await Dynamo.get(item_id, itemsTable);

        var categoryContent = user[category];

        console.log(categoryContent);

        categoryContent.forEach(element => {
            if (item_id !== element)
                updatedContent.push(element);
            else
                isFound = true;
        });

        if(!isFound)
            return Responses._400({"message": "Can't find item_id in source category"});

        console.log("should now have deleted the item from category in userstable");
        console.log(updatedContent);

        //now update users table to reflect the change
        await Dynamo.update({
            tableName: usersTable,
            primaryKey: "ID",
            primaryKeyValue: user_id,
            updateKey: `${category}`,
            updateValue: updatedContent
        });

    } else if (sourceType === "folder") {
        var sourceFolder = await Dynamo.get(sourceFolderID, foldersTable);

        if (!sourceFolder)
            return Responses._400({ "message": "Can't find source folder" });

        var item = await Dynamo.get(item_id, itemsTable);
        if (!item)
            return Responses._400({ "message": "Can't find this item" });

        var sourceFolderContents = sourceFolder.contents;

        sourceFolderContents.forEach(element => {
            if (element !== item_id)
                updatedContent.push(element);
            else
                isFound = true;
        });

        if(!isFound)
            return Responses._400({"message": "Can't find item_id in source folder"});

        //delete item id from source folder
        await Dynamo.update({
            tableName: foldersTable,
            primaryKey: "ID",
            primaryKeyValue: sourceFolderID,
            updateKey: "contents",
            updateValue: updatedContent
        });

        var newFolderSize = sourceFolder.folder_size - item.fileSizeKB;

        await Dynamo.update({
            tableName: foldersTable,
            primaryKey: "ID",
            primaryKeyValue: sourceFolderID,
            updateKey: "folder_size",
            updateValue: newFolderSize
        });
    }

    //put item_id in dest folder
    var folderContents = destFolder.contents;

    folderContents.push(item_id);

    await Dynamo.update({
        tableName: foldersTable,
        primaryKey: "ID",
        primaryKeyValue: destFolderID,
        updateKey: "contents",
        updateValue: folderContents
    });

    //reflect container folder change in itemsTable
    await Dynamo.update({
        tableName: itemsTable,
        primaryKey: "ID",
        primaryKeyValue: item_id,
        updateKey: "folder_id",
        updateValue: destFolderID
    });

    var fid_cat = destFolderID + category;
    await Dynamo.update({
        tableName: itemsTable,
        primaryKey: "ID",
        primaryKeyValue: item_id,
        updateKey: "fid_cat",
        updateValue: fid_cat
    });

    var newSize = destFolder.folder_size + item.fileSizeKB;

    //reflect size change in dest folder
    await Dynamo.update({
        tableName: foldersTable,
        primaryKey: "ID",
        primaryKeyValue: destFolderID,
        updateKey: "folder_size",
        updateValue: newSize
    });


    


    return Responses._200({ "message": "Moved file successfully" });
};

exports.handler = withHooks(handler);