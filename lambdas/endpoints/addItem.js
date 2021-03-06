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

    var indx;
    var thumbKey;
    var searchName;

    if(fileKey && !event.body.url){
        indx = fileKey.indexOf("/");
        thumbKey = fileKey.slice(0, indx + 1) + "thumb-" + fileKey.slice(indx + 1);
        searchName = fileKey.substring(fileKey.indexOf("/") + 1).toLowerCase();
    }

    if(event.body.url){
        searchName = event.body.description;
    }
    
    var folder_id = event.body.folder_id;
    var category = event.body.category.toLowerCase().trim();
    var url = event.body.url;
    var type = event.body.type;
    var uid_cat = ID + category;
    var item = {
        "category": category,
        "ID": event.body.item_id,
        "folder_id": folder_id,
        "uid_cat": uid_cat,
        "last_modified": event.body.last_modified,
        "timestamp": event.body.timestamp,
        "fileSizeKB": event.body.fileSizeKB,
        "key": fileKey,
        "search_name": searchName,
        "description": event.body.description,
        "thumbKey": thumbKey,
        "url": url,
        "type": type,
    };

    if(fileKey){
        indx = fileKey.indexOf("/");
        if(category === "images" || category === "videos")
            thumbKey = fileKey.slice(0, indx + 1) + "thumb-" + fileKey.slice(indx + 1);
    }

    if(folder_id)
        item["in_folder"] = true;
    else
        item["in_folder"] = false;

    var user_id = ID;

    if(item.fileSizeKB < 0){
        return Responses._400({ "message" : "file Size Is Negative" });
    }

    if(user.usedSpace + item.fileSizeKB > user.totalAvailableSpace){
        return Responses._400({"message": "Quota is finished! Please upgrade"});
    }

    if (folder_id) {

        var folder = await Dynamo.get(folder_id, foldersTable);
        item["fid_cat"] = folder_id + category;

        if(!folder)
            return Responses._400({"message" : "Can't find the destination folder"});
        var newContents = folder.contents;
        newContents.push(item.ID);

        var newFolderSize = folder.folder_size + item.fileSizeKB;

        //update folders table with new folder size
        await Dynamo.update({
            tableName: foldersTable,
            primaryKey: "ID",
            primaryKeyValue: folder_id,
            updateKey: "folder_size",
            updateValue: newFolderSize
        });
    }

    if(category == "social"){
        var numOfPosts;
        if(type == "twitter")
            numOfPosts = user.twitter;
        else if(type == "instagram")
            numOfPosts = user.instagram;
        else if(type == "snapchat")
            numOfPosts = user.snapchat;
        else if(type == "facebook")
            numOfPosts = user.facebook;
    
        if(!numOfPosts)
            numOfPosts = 0;
    
        await Dynamo.update({
            tableName: usersTable,
            primaryKey: "ID",
            primaryKeyValue: user_id,
            updateKey: type,
            updateValue: numOfPosts + 1
        });
    }

    //update usersTable with new used space
    var newUsedSpace = user.usedSpace + event.body.fileSizeKB;

    await Dynamo.update({
        tableName: usersTable,
        primaryKey: "ID",
        primaryKeyValue: user_id,
        updateKey: "usedSpace",
        updateValue: newUsedSpace
    });

    await Dynamo.write(item, itemsTable);

    return Responses._200({ "message" : "Successfully added item" });
};

exports.handler = withHooks(handler);