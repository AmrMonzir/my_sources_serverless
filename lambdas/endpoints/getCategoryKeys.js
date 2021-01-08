const Responses = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");
const { withHooks } = require("../common/hooks");

const tableName = process.env.foldersTable;
const usersTable = process.env.usersTable;

const handler = async event =>{

    if(!event.pathParameters.ID){
        //failed without an ID
        return Responses._400({message: 'Missing the id from the path'});
    }

    // have user id here
    let ID = event.pathParameters.ID;

    //make sure ID exists in db
    const user = await Dynamo.get(ID, usersTable);

    if (!user) {
        return Responses._404({ message: 'Failed to find user with that ID' });
    }

    const category = event.body.category;

    console.log(event.body);
    console.log(category);

    var allKeys = [];
    
    const userCategoryFolders = await Dynamo.query({
        tableName, 
        index: 'id_cat',
        queryKey: 'id_cat',
        queryValue: ID+category,
    });

    console.log(userCategoryFolders);

    userCategoryFolders.forEach(element => {
        element.content.contents.forEach(element=>{
            allKeys.push(element);
        });
    });

    if(user[category])
        if(user[category][category+"Keys"])
            user[category][category+"Keys"].forEach(element =>{
                allKeys.push(element);
                });

    return Responses._200(allKeys);
};

exports.handler = withHooks(handler);