const Responses = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");
const { withHooks } = require("../common/hooks");

const foldersTable = process.env.foldersTable;
const usersTable = process.env.usersTable;

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
    let url = event.body.url;
    let fileKey = event.body.fileKey;

    var updatedContent = [];
    var updatedThumbContent = [];


    var destFolder = await Dynamo.get(destFolderID, foldersTable);
    if(!destFolder){
        return Responses._400({"message": "can't find folder in db"});
    }
    if(destFolder.user_id !== user_id){
        return Responses._400({"message": "can't move to a different user's folder"});
    }
    
    if (sourceType === "category") {
        var user = await Dynamo.get(user_id, usersTable);

        if (category === "images" || category === "videos") {
            console.log("type is img or vid from category");

            user[category][category + "Keys"].forEach(element => {
                if (fileKey !== element) {
                    updatedContent.push(element);
                }
            });

            user[category]["thumbnailsKeys"].forEach(element => {
                var thumbkey = "thumb-" + fileKey;
                if (thumbkey !== element) {
                    updatedThumbContent.push(element);
                }
            });

            const concata = category + "Keys";

            await Dynamo.update({
                tableName: usersTable,
                primaryKey: 'ID',
                primaryKeyValue: user_id,
                updateKey: `${category}`,
                updateValue: {
                    "concata": updatedContent,
                    "thumbnailsKeys": updatedThumbContent
                },
                type: concata,
            });

            console.log("successfully deleted key from category");
            //now add this file key to the destination folder id

            var thumbkey = "thumb-" + fileKey;
            destFolder.content.contents.push(fileKey);
            destFolder.content.thumbnails.push(thumbkey);
            res = await Dynamo.write(destFolder, foldersTable);

        } else if (category === "documents") {
            console.log("type is docs from category");

            user[category]["docKeys"].forEach(element => {
                if (fileKey !== element) {
                    updatedContent.push(element);
                }
            });

            await Dynamo.update({
                tableName: usersTable,
                primaryKey: 'ID',
                primaryKeyValue: user_id,
                updateKey: `${category}`,
                updateValue: {
                    "docKeys": updatedContent,
                },
            });
            console.log("successfully deleted key from category");
            //now add this file key to the destination folder id
            destFolder["docKeys"].push(fileKey);
            res = await Dynamo.write(destFolder, foldersTable);

        } else if (category === "social") {
            console.log("type is social from category");

            user[category]["urls"].forEach(element => {
                if (url !== element) {
                    updatedContent.push(element);
                }
            });

            await Dynamo.update({
                tableName: usersTable,
                primaryKey: 'ID',
                primaryKeyValue: user_id,
                updateKey: `${category}`,
                updateValue: {
                    "urls": updatedContent,
                },
            });
            console.log("successfully deleted key from category");
            //now add this file key to the destination folder id
            destFolder["urls"].push(url);
            res = await Dynamo.write(destFolder, foldersTable);
        } else {
            return Responses._400({ "message": "Error in category type" });
        }
    } else if (sourceType === "folder") {
        var sourceFolder = await Dynamo.get(sourceFolderID, foldersTable);

        //check if category is images or videos or else
        if (category === "images" || category === "videos") {
            //first delete it from the lists
            console.log("type is images or videos");
            console.log(sourceFolder);
            sourceFolder.content.thumbnails.forEach(element => {
                var thumbkey = "thumb-" + fileKey;
                if (thumbkey !== element)
                    updatedThumbContent.push(element);
            });

            sourceFolder.content.contents.forEach(element => {
                if (fileKey !== element)
                    updatedContent.push(element);
            });

            console.log(updatedContent);
            console.log(updatedThumbContent);
            console.log(foldersTable);

            await Dynamo.update({
                tableName: foldersTable,
                primaryKey: 'ID',
                primaryKeyValue: sourceFolderID,
                updateKey: "content",
                updateValue: {
                    "contents": updatedContent,
                    "thumbnails": updatedThumbContent
                },
            });

            console.log("successfully deleted key from source folder");
            //now add this file key to the destination folder id

            var thumbkey = "thumb-" + fileKey;
            destFolder.content.contents.push(fileKey);
            destFolder.content.thumbnails.push(thumbkey);
            res = await Dynamo.write(destFolder, foldersTable);

        } else if (category === "documents") {
            //first delete it from the lists

            console.log("type is docs");
            sourceFolder["docKeys"].forEach(element => {
                if (fileKey !== element)
                    updatedContent.push(element);
            });
            await Dynamo.update({
                tableName: foldersTable,
                primaryKey: 'ID',
                primaryKeyValue: sourceFolderID,
                updateKey: "docKeys",
                updateValue: updatedContent,
                
            });
            console.log("successfully deleted key from source folder");
            //now add this file key to the destination folder id
            destFolder["docKeys"].push(fileKey);
            res = await Dynamo.write(destFolder, foldersTable);

        } else if (category === "social") {
            console.log("type is social");
            sourceFolder["urls"].forEach(element => {
                if (fileKey !== element)
                    updatedContent.push(element);
            });
            await Dynamo.update({
                tableName: foldersTable,
                primaryKey: 'ID',
                primaryKeyValue: sourceFolderID,
                updateKey: "urls",
                updateValue: updatedContent
            });
            console.log("successfully deleted key from source folder");
            //now copy add this file key to the destination folder id
            destFolder["urls"].push(url);
            res = await Dynamo.write(destFolder, foldersTable);

        } else {
            return Responses._400({ "message": "Unrecognized category type" });
        }
    }

    return Responses._200({ "message": "Moved file successfully" });
};

exports.handler = withHooks(handler);