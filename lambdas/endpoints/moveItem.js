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

    var destFolder = await Dynamo.get(destFolderID, foldersTable);

    if (!destFolder) {
        return Responses._400({ "message": "can't find folder in db" });
    }
    if (destFolder.user_id !== user_id) {
        return Responses._400({ "message": "can't move to a different user's folder" });
    }

    var item = await Dynamo.get(item_id, itemsTable);
    if (!item)
        return Responses._400({ "message": "Can't find this item" });

    if (sourceType === "category") {

    } else if (sourceType === "folder") {
        var sourceFolder = await Dynamo.get(sourceFolderID, foldersTable);

        if (!sourceFolder)
            return Responses._400({ "message": "Can't find source folder" });

        var newFolderSize = sourceFolder.folder_size - item.fileSizeKB;

        await Dynamo.update({
            tableName: foldersTable,
            primaryKey: "ID",
            primaryKeyValue: sourceFolderID,
            updateKey: "folder_size",
            updateValue: newFolderSize
        });
    }

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