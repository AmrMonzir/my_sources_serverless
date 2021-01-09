const Responses = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");
const { withHooks } = require("../common/hooks");

const foldersTable = process.env.foldersTable;
const usersTable = process.env.usersTable;

const handler = async event => {

    if (!event.pathParameters.KEY) {
        //failed without a key
        return Responses._400({ message: 'Missing the file key from the path' });
    }


    let fileKey = event.pathParameters.KEY;
    var folder_id = event.body.folder_id;
    var user_id = event.body.user_id;
    var category = event.body.category;
    category = category.toLowerCase().trim();

    var newContent = [];
    var newThumbContent = [];

    if (!folder_id && user_id) {
        //the key is in users table
        const user = await Dynamo.get(user_id, usersTable);
        console.log("printing user");
        console.log(user);
        console.log("printing user category");
        console.log(user[category]);

        //TODO make sure this code works
        //TODO account for doc and soc keys
        if (category === "images" || category === "videos") {
            console.log("file in user entry, file is img or vid");
            user[category][category + "Keys"].forEach(element => {
                if (fileKey !== element) {
                    newContent.push(element);
                }
            });

            user[category]["thumbnailsKeys"].forEach(element => {
                var thumbkey = "thumb-" + fileKey;
                if (thumbkey !== element) {
                    newThumbContent.push(element);
                }
            });

            const concata = category + "Keys";

            await Dynamo.update({
                tableName: usersTable,
                primaryKey: 'ID',
                primaryKeyValue: user_id,
                updateKey: `${category}`,
                updateValue: {
                    "concata": newContent,
                    "thumbnailsKeys": newThumbContent
                },
                type: concata,
            });
        } else if (category === "documents") {
            console.log("type is documents in users entry");
            user[category]["docKeys"].forEach(element => {
                if (fileKey !== element) {
                    newContent.push(element);
                }
            });

            await Dynamo.update({
                tableName: usersTable,
                primaryKey: 'ID',
                primaryKeyValue: user_id,
                updateKey: `${category}`,
                updateValue: {
                    "docKeys": newContent,
                },
            });
        } else if (category === "social") {
            console.log("type is social from category");

            user[category]["urls"].forEach(element => {
                if (url !== element) {
                    newContent.push(element);
                }
            });

            await Dynamo.update({
                tableName: usersTable,
                primaryKey: 'ID',
                primaryKeyValue: user_id,
                updateKey: `${category}`,
                updateValue: {
                    "urls": newContent,
                },
            });
        } else {
            return Response._400({ "message": "Unrecognized category in users table" });
        }

    } else if (folder_id && !user_id) {
        //the key is in folders table

        if (category === "images" || category === "videos") {

            const folder = await Dynamo.get(folder_id, foldersTable);
            console.log(folder);
            folder.content.thumbnails.forEach(element => {
                var thumbkey = "thumb-" + fileKey;
                if (thumbkey !== element)
                    newThumbContent.push(element);
            });

            folder.content.contents.forEach(element => {
                if (fileKey !== element)
                    newContent.push(element);
            });
            await Dynamo.update({
                tableName: foldersTable,
                primaryKey: 'ID',
                primaryKeyValue: folder_id,
                updateKey: "content",
                updateValue: {
                    "contents": newContent,
                    "thumbnails": newThumbContent
                },
            });
        }else if(category === "documents"){

            console.log("type is docs");
            folder["docKeys"].forEach(element => {
                if (fileKey !== element)
                    newContent.push(element);
            });
            await Dynamo.update({
                tableName: foldersTable,
                primaryKey: 'ID',
                primaryKeyValue: folder_id,
                updateKey: "docKeys",
                updateValue: newContent,
            });

        }else if (category === "social"){
            console.log("type is social");
            folder["urls"].forEach(element => {
                if (fileKey !== element)
                    newContent.push(element);
            });
            await Dynamo.update({
                tableName: foldersTable,
                primaryKey: 'ID',
                primaryKeyValue: folder_id,
                updateKey: "urls",
                updateValue: newContent
            });
        }else{
            return Response._400({ "message": "Unrecognized category in folders table" });
        }


    } else {
        return Responses._400({ "message": "no folder_id or user_id found" });
    }
    return Responses._200({ "message": "Deleted file successfully" });
};

exports.handler = withHooks(handler);