const Responses = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");

const tableName = process.env.usersTableName;

exports.handler = async event =>{
    console.log('event', event);

    if(!event.pathParameters || !event.pathParameters.ID){
        //failed without an ID
        return Responses._400({message: 'Missing the id from the path'});
    }

    let ID = event.pathParameters.ID;
    const data = JSON.parse(event.body);

    const res = await Dynamo.update({
        tableName,
        primaryKey: 'ID',
        primaryKeyValue: ID,
        updateKey: 'score',
        updateValue: data["score"],
    });

    return Responses._200({});
}