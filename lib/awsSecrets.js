const AWS = require('aws-sdk');

module.exports = getSecretValue;

async function getSecretValue({region, secretName}) {
    let client = new AWS.SecretsManager({
        region: region
    });

    return new Promise((resolve, reject) => {
        client.getSecretValue({ SecretId: secretName }, function (err, data) {
            if (err) {
                if (err.code === 'DecryptionFailureException')
                    // Secrets Manager can't decrypt the protected secret text using the provided KMS key.
                    // Deal with the exception here, and/or rethrow at your discretion.
                    reject(err);
                else if (err.code === 'InternalServiceErrorException')
                    // An error occurred on the server side.
                    // Deal with the exception here, and/or rethrow at your discretion.
                    reject(err);
                else if (err.code === 'InvalidParameterException')
                    // You provided an invalid value for a parameter.
                    // Deal with the exception here, and/or rethrow at your discretion.
                    reject(err);
                else if (err.code === 'InvalidRequestException')
                    // You provided a parameter value that is not valid for the current state of the resource.
                    // Deal with the exception here, and/or rethrow at your discretion.
                    reject(err);
                else if (err.code === 'ResourceNotFoundException')
                    // We can't find the resource that you asked for.
                    // Deal with the exception here, and/or rethrow at your discretion.
                    reject(err);
            } else {
                // Decrypts secret using the associated KMS CMK.
                // Depending on whether the secret is a string or binary, one of these fields will be populated.
                let str = "<nothing>";
                try {
                    if ('SecretString' in data) {
                        str = data.SecretString;
                    } else {
                        let buff = new Buffer(data.SecretBinary, 'base64');
                        str = buff.toString('ascii');
                    }
                    resolve(JSON.parse(str))
                } catch (e) {
                    reject({ code: "InvalidDataFormat", message: "Was expecting a JSON string but got: " + str })
                }
            }
        });
    });
}