const Responses = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");
const { withHooks } = require("../common/hooks");
const { v4: uuidv4 } = require('uuid');

const foldersTable = process.env.foldersTable;
const usersTable = process.env.usersTable;

const handler = async event =>{
    console.log('event', event);

    if(!event.pathParameters.ID){
        //failed without an ID
        return Responses._400({message: 'Missing the id from the path'});
    }

    //get user ID from path
    let ID = event.pathParameters.ID;

    //make sure ID exists in db
    const user = await Dynamo.get(ID, usersTable);

    if (!user) {
        return Responses._404({ message: 'Failed to find user with that ID' });
    }

    console.log("found user! now creating folder");

    const folder = event.body;

    //generate random ID for folder
    let folder_id = uuidv4();
    console.log(folder_id);
    var category = folder["category"].toLowerCase().trim();
    folder["ID"] = folder_id;
    folder["user_id"] = ID;
    folder["id_cat"] = ID + category
    if(category === "documents"){
        folder["docKeys"] = [];
    }else if(category === "images" || category === "videos"){
        folder["content"] = {"contents" : [], "thumbnails" : []}
    }else if(category === "social"){
        folder["urls"] = [];
    }else{
        return Responses._400({"message": "Unrecognized category type"});
    }



    console.log(folder);
    const newFolder = await Dynamo.write(folder, foldersTable);

    return Responses._200(newFolder);
};

exports.handler = withHooks(handler);