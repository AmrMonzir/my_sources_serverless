const Responses = require("../common/API_Responses");
const Dynamo = require("../common/Dynamo");
const { withHooks } = require("../common/hooks");

const usersTable = process.env.usersTable;

const handler = async event => {

    console.log("got into handler");

    if (!event.pathParameters.ID) {
        //failed without a key
        return Responses._400({ message: 'Missing the file key from the path' });
    }


    let userId = event.pathParameters.ID;
    let productId = event.body.product_id;

    const user = await Dynamo.get(userId, usersTable);

    if (!user) {
        return Responses._404({ message: 'Failed to find user with that ID' });
    }

    //update total available space with purchase amount
    var newSpace;
    if(productId === "200mb_quota")
        newSpace = user.totalAvailableSpace + 204800;
    else if(productId === "400mb_quota")
        newSpace = user.totalAvailableSpace + 409600;
    else if(productId === "800mb_quota")
        newSpace = user.totalAvailableSpace + 819200;
    else if(productId === "gb_quota")
        newSpace = user.totalAvailableSpace + 1048576;

    await Dynamo.update({
        tableName: usersTable,
        primaryKey: "ID",
        primaryKeyValue: userId,
        updateKey: "totalAvailableSpace",
        updateValue: newSpace,
    });

    return Responses._200({ "message": "Purchase successful" });
};

exports.handler = withHooks(handler);