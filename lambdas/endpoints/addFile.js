const Responses = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");
const { withHooks } = require("../common/hooks");

const usersTable = process.env.usersTable;
const foldersTable = process.env.foldersTable;

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

    //to add a file, I need the key and the user_id, and the folder_id if exists

    var fileKey = event.body.fileKey;

    var indx = fileKey.indexOf("/");
    var thumbKey = fileKey.slice(0, indx+1) + "thumb-" + fileKey.slice(indx+1);

    // var thumbKey = "thumb-" + fileKey;
    var folder_id = event.body.folder_id;
    var category = event.body.category.toLowerCase().trim();
    var url = event.body.url;

    if(!fileKey && !url){
        return Responses._400({"message": "fileKey or url not set"});
    }
    
    var res;
    if (folder_id) {
        var folder = await Dynamo.get(folder_id, foldersTable);

        if (category === "images" || category === "videos") {
            folder.content.contents.push(fileKey);
            folder.content.thumbnails.push(thumbKey);
        }
        else if(category === "documents"){
            folder["docKeys"].push(fileKey);
        }else if(category === "social"){
            folder["urls"].push(url);
        }
        res = await Dynamo.write(folder, foldersTable);
    } else {
        if (category === "images" || category === "videos") {
            var categoryKeys = category + "Keys";
            console.log(category);
            console.log(categoryKeys);
            console.log(user);
            console.log(user[category]);
            console.log(user[category][category + "Keys"]);
            console.log(user[category]["thumbnailsKeys"]);
            user[category][categoryKeys].push(fileKey);
            user[category]["thumbnailsKeys"].push(thumbKey);
        } else if (category === "documents") {
            user[category]["docKeys"].push(fileKey);
        }else if(category === "social"){
            if(!url){
                return Response._400({"message": "error url not set"});
            }
            user[category]["urls"].push(url);
        }
        res = await Dynamo.write(user, usersTable);
    }

    return Responses._200({ res });
};

exports.handler = withHooks(handler);