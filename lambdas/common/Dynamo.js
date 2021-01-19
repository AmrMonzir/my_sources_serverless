const AWS = require('aws-sdk');

const documentClient = new AWS.DynamoDB.DocumentClient();

const Dynamo = {
    async get(ID, TableName){
        const params = {
            TableName,
            Key: {
                ID,
            },
        };

        const data = await documentClient.get(params).promise();

        if(!data || !data.Item){
            throw Error(`There was an error fetching the data for ID of ${ID}, from ${TableName}`);
        }

        console.log(data);
        return data.Item;
    },

    async write(data, TableName){
        if(!data.ID){
            throw Error('no ID on the data');
        }

        const params = {
            TableName, 
            Item: data
        };

        const res = await documentClient.put(params).promise();

        if(!res){
            throw Error('There was an error inserting ID of ${data.ID} in table ${TableName}');
        }

        return data;
    },

    async delete(ID, TableName){
        const params = {
            TableName,
            Key: {
                ID,
            },
        };
        try{
            await documentClient.delete(params).promise();
        }catch( err){
            return err;
        }
    },
     
    update: async ({ tableName, primaryKey, primaryKeyValue, updateKey, updateValue, type }) => {
        if(type){
            var tostr = JSON.stringify(updateValue);
            tostr = tostr.replace("concata", type);
            updateValue = JSON.parse(tostr);
        }
        const params = {
            TableName: tableName,
            Key: { [primaryKey]: primaryKeyValue },
            UpdateExpression: `set ${updateKey} = :updateValue`,
            ExpressionAttributeValues: {
                ':updateValue': updateValue,
            },
        };
        console.log(tableName);
        console.log(updateKey);
        console.log(updateValue);

        return documentClient.update(params).promise();
    },

    removeItem: async ({ tableName, primaryKey, primaryKeyValue, updateKey, updateIndex }) => {
        const params = {
            TableName:tableName,
            Key: { [primaryKey]: primaryKeyValue },
            UpdateExpression: `remove ${updateKey}[${updateIndex}]`,
            ReturnValues:"UPDATED_NEW"
        };

        return documentClient.update(params).promise();
    },

    query: async ({tableName, index, queryKey, queryValue, startKey, limit, attributesToGet}) => {
        const  params = {
            TableName: tableName,
            IndexName: index,
            KeyConditionExpression: `${queryKey} = :hkey`,
            ExclusiveStartKey: startKey,
            Limit: limit,
            ProjectionExpression: attributesToGet,
            ExpressionAttributeValues: {
                ':hkey': queryValue,
            },
        };

        const res = await documentClient.query(params).promise();

        return res || [];
    },

    search: async ({tableName, index, queryKey, queryValue, startKey, limit, attributesToGet, filterAttribute, searchWord}) => {
        console.log(searchWord);
        const  params = {
            TableName: tableName,
            IndexName: index,
            KeyConditionExpression: `${queryKey} = :hkey`,
            FilterExpression: filterAttribute? 'contains (#key, :searchWord)' : null,
            ExclusiveStartKey: startKey,
            Limit: limit,
            ProjectionExpression: attributesToGet,
            ExpressionAttributeNames: filterAttribute? {
                "#key": filterAttribute
            } : null,
            ExpressionAttributeValues: {
                ':hkey': queryValue,
                ':searchWord': searchWord,
            },
        };

        console.log(searchWord);
        
        console.log(params.FilterExpression);

        const res = await documentClient.query(params).promise();

        return res || [];
    }


};

module.exports = Dynamo;