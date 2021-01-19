const Responses = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");
const { withHooks } = require("../common/hooks");

const foldersTable = process.env.foldersTable;
const usersTable = process.env.usersTable;
const itemsTable = process.env.itemsTable;

const handler = async event => {

    if (!event.pathParameters.ID) {
        //failed without an ID
        return Responses._400({ message: 'Missing the folder id from the path' });
    }

    // have user id here
    let user_id = event.pathParameters.ID;

    const startKey = event.body.startKey;
    const folder_id = event.body.folder_id;
    const category = event.body.category;
    const searchWord = event.body.search_word;
    const user = await Dynamo.get(user_id, usersTable);

    if (!user) {
        return Responses._404({ message: 'Failed to find folder or user with that ID' });
    }

    if (!folder_id) {
        //search for items by category
        //get items inside and outside folders
        var uid_cat = user_id + category;

        console.log(uid_cat);
        
        var res = await Dynamo.search({
            tableName: itemsTable,
            index: "uid_cat",
            queryKey: "uid_cat",
            queryValue: uid_cat,
            startKey: startKey,
            limit: 10,
            filterAttribute: "search_name",
            searchWord: searchWord,
        });

        console.log(res);

        return Responses._200({ "items": res.Items, "lastEvaluatedKey": res.LastEvaluatedKey });
        
    } else {
        //search for items inside folders
        const folder = await Dynamo.get(folder_id, foldersTable);

        if (!folder)
            return Responses._400({ "message": "cant find the folder specified" });

        const fid_cat = folder_id + folder.category;

        console.log(searchWord);
        var res = await Dynamo.search({
            tableName: itemsTable,
            index: "fid_cat",
            queryKey: "fid_cat",
            queryValue: fid_cat,
            startKey: startKey,
            limit: 10,
            filterAttribute: "search_name",
            searchWord: searchWord,
        });
        console.log(searchWord);


        return Responses._200({ "items": res.Items, "lastEvaluatedKey": res.LastEvaluatedKey });
    }







    const fid_cat = folder_id + folder.category;

    console.log(fid_cat);
    var response = await Dynamo.query({
        tableName: itemsTable,
        index: "fid_cat",
        queryKey: "fid_cat",
        queryValue: fid_cat,
        startKey: startKey,
        limit: 10,
    });

    console.log(response);

    return Responses._200({ "items": response.Items, "lastEvaluatedKey": response.LastEvaluatedKey });
};

exports.handler = withHooks(handler);