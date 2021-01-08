const Responses = require("../common/API_Responses");

exports.handler = async event =>{
    console.log('event', event);

    if(!event.pathParameters || !event.pathParameters.ID){
        //failed without an ID
        return Responses._400({message: 'Missing the id from the path'});
    }

    let ID = event.pathParameters.ID;

    if(data[ID]){
        //return the data
        return Responses._200(data[ID]);
    }

    //failed as ID was not in the data
    return Responses._400({message : 'No ID in data'});
}

const data = {
    1234: {name: 'Anna Jones', age: 25, job: 'journalist'},
    7893: {name: 'Chris Smith', age: 53, job: 'teacher'},
    1235: {name: 'tom', age: 13, job: 'retard'},
}