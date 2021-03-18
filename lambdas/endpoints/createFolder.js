const Responses = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");
const { withHooks } = require("../common/hooks");

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

    const folder_id = event.body.ID;

    var category = folder["category"].toLowerCase().trim();
    folder["ID"] = folder_id;
    folder["user_id"] = ID;
    folder["id_cat"] = ID + category
    folder["folder_size"] = 0;
    folder["contents"] = [];

    if(!folder.name)
        return Responses._400({"message" : "Folders must have names!"});

    //make sure folder doesn't exist before
    const categoryFolders = await Dynamo.query({
        tableName: foldersTable,
        index: 'id_cat',
        queryKey: 'id_cat',
        queryValue: ID + category
    });

    console.log(categoryFolders.Items.length);

    for(let i = 0 ; i < categoryFolders.Items.length ; i++){
        console.log(categoryFolders.Items[i]);
        console.log(folder.name);
        console.log(categoryFolders.Items[i]["name"]);
        if(categoryFolders.Items[i]["name"] === folder.name){
            return Responses._400({"message" : "Can't have duplicate folders"});
        }
    }
    
    console.log(folder);
    const newFolder = await Dynamo.write(folder, foldersTable);

    return Responses._200(newFolder);
};

exports.handler = withHooks(handler);