const Responses = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");
const { withHooks } = require("../common/hooks");

const usersTable = process.env.usersTable;

const handler = async event => {

    if (!event.pathParameters.ID) {
        return Responses._400({ message: 'Missing the user ID from the path' });
    }

    let user_id = event.pathParameters.ID;
    let phoneNumber = event.body.phone_number;
    let userName = event.body.user_name;

    const user = await Dynamo.get(user_id, usersTable);

    if(!user)
        return Responses._400({"message" : "User not found"});
    
    if(phoneNumber){
        await Dynamo.update({
            tableName: usersTable,
            primaryKey: 'ID',
            primaryKeyValue: user_id,
            updateKey: `phoneNumber`,
            updateValue: phoneNumber
        });
    }

    if(userName){
        await Dynamo.update({
            tableName: usersTable,
            primaryKey: 'ID',
            primaryKeyValue: user_id,
            updateKey: `name`,
            updateValue: userName
        });
    }
    
    return Responses._200({"message" : "User updated successfully"});
};

exports.handler = withHooks(handler);