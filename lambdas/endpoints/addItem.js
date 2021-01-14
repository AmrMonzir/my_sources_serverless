const Responses = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");
const { withHooks } = require("../common/hooks");

const usersTable = process.env.usersTable;
const foldersTable = process.env.foldersTable;
const itemsTable = process.env.itemsTable;

const handler = async event => {

    if (!event.pathParameters.ID) {
        //failed without an ID
        return Responses._400({ message: 'Missing the id from the path' });
    }

    let ID = event.pathParameters.ID;

    //make sure user exists in db
    const user = await Dynamo.get(ID, usersTable);

    if (!user) {
        return Responses._404({ message: 'Failed to find user with that ID' });
    }

    var fileKey = event.body.fileKey;

    var indx = fileKey.indexOf("/");
    var thumbKey = fileKey.slice(0, indx + 1) + "thumb-" + fileKey.slice(indx + 1);

    var folder_id = event.body.folder_id;
    var category = event.body.category.toLowerCase().trim();
    var url = event.body.url;


    var item = {
        "category": category,
        "item_id": event.body.item_id,
        "folder_id": folder_id,
        "in_folder": this.folder_id ? true : false,
        "user_id": ID,
        "last_modified": event.body.last_modified,
        "timestamp": event.body.timestamp,
        "fileSizeKB": event.body.fileSizeKB,
        "key": fileKey,
        "thumbKey": thumbKey,
        "url": url
    };


    if(item.fileSizeKB < 0){
        return Responses._400({ "message" : "file Size Is Negative" });
    }

    if(user.usedSpace + item.fileSizeKB > user.totalAvailableSpace){
        return Responses._400({"message": "Quota is finished! Please upgrade"});
    }

    var res;
    if (item.in_folder) {

        var folder = await Dynamo.get(folder_id, foldersTable);

        var newContents = folder.contents;

        newContents.push(item.item_id);

        var newFolderSize = folder.folder_size + event.body.fileSizeKB;

        var newUsedSpace = user.usedSpace + event.body.fileSizeKB;

        //update folders table with new folder details
        res = await Dynamo.update({
            tableName: foldersTable,
            primaryKey: "ID",
            primaryKeyValue: folder_id,
            updateKey: "contents",
            updateValue: newContents
        });

        //update folders table with new folder size
        res = await Dynamo.update({
            tableName: foldersTable,
            primaryKey: "ID",
            primaryKeyValue: folder_id,
            updateKey: "folder_size",
            updateValue: newFolderSize
        });

        //update usersTable with new used space
        res = await Dynamo.update({
            tableName: usersTable,
            primaryKey: "ID",
            primaryKeyValue: user_id,
            updateKey: "usedSpace",
            updateValue: newUsedSpace
        });

        await Dynamo.write(item, itemsTable);

    } else {

        var catContent = user[category];
        catContent.push(item.item_id);

        var newUsedSpace = user.usedSpace + event.body.fileSizeKB;

        res = await Dynamo.update({
            tableName: usersTable,
            primaryKey: "ID",
            primaryKeyValue: user_id,
            updateKey: "usedSpace",
            updateValue: newUsedSpace
        });

        // add item id to user category
        res = await Dynamo.update({
            tableName: usersTable,
            primaryKey: "ID",
            primaryKeyValue: user_id,
            updateKey: category,
            updateValue: catContent
        });

        await Dynamo.write(item, itemsTable);
    }

    return Responses._200({ "message" : "Successfully added item" });
};

exports.handler = withHooks(handler);