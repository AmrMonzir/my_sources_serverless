const { _400 } = require("../common/API_Responses");
const Responses = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");
const { withHooks } = require("../common/hooks");

const tableName = process.env.foldersTable;
const usersTable = process.env.usersTable;

const handler = async event => {

    if (!event.pathParameters.KEY) {
        //failed without a key
        return Responses._400({ message: 'Missing the file key from the path' });
    }


    //TODO file could be in users table if not in a folder

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

        // var indexOfKey = user[category][category + "Keys"].indexOf(fileKey);
        // var indexOfThumb = user[category]["thumbnailsKeys"].indexOf("thumb-" + fileKey);

        // console.log("index of key");
        // console.log(indexOfKey);
        // console.log("index of thumb");
        // console.log(indexOfThumb);

        // await Dynamo.removeItem({
        //     usersTable,
        //     primaryKey: 'ID',
        //     primaryKeyValue: user_id,
        //     updateKey: user[category][category + "Keys"],
        //     updateIndex: indexOfKey
        // });

        // await Dynamo.removeItem({
        //     usersTable,
        //     primaryKey: 'ID',
        //     primaryKeyValue: user_id,
        //     updateKey: user[category]["thumbnailsKeys"],
        //     updateIndex: indexOfThumb
        // });

        //TODO make sure this code works
        //TODO account for doc and soc keys
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

        if(newContent.length === 0){
            console.log("new content is empty");
            newContent = [""];
            newThumbContent = [""];
        }

        const concata = category + "Keys";

        await Dynamo.update({
            usersTable,
            primaryKey: 'ID',
            primaryKeyValue: user_id,
            updateKey: `${category}`,
            updateValue: {
                concata : newContent,
                "thumbnailsKeys" : newThumbContent
            },
        });
        

    } else {
        //the key is in folders table
        const folder = await Dynamo.get(folder_id, tableName);
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
            tableName,
            primaryKey: 'ID',
            primaryKeyValue: folder_id,
            updateKey: "content",
            updateValue: {
                "contents" : newContent,
                "thumbnails" : newThumbContent
            },
        });

    }
    return Responses._200({ "message": "Deleted file successfully" });
};

exports.handler = withHooks(handler);