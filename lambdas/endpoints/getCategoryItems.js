const Responses = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");
const { withHooks } = require("../common/hooks");

const usersTable = process.env.usersTable;
const itemsTable = process.env.itemsTable;

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
    const lastEvaluatedKey = event.body.startKey;

    console.log(event.body);
    console.log(category);


    var response = await Dynamo.query({
        tableName: itemsTable,
        index: 'user_id',
        queryKey: 'user_id',
        queryValue: ID,
        startKey: lastEvaluatedKey
    });


    return Responses._200({"items": response.items, "lastEvaluatedKey": response.LastEvaluatedKey});
};

exports.handler = withHooks(handler);