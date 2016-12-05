var AWS = require('aws-sdk');
var fs = require('fs');
var _ = require('underscore');

var s3 = new AWS.S3({
    signatureVersion: 'v4',
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

function createDirectoryIfNotExists(directory) {
  try {
    fs.mkdirSync(directory);
  } catch(e) {
    if ( e.code != 'EEXIST' ) throw e;
  }
}

/**
 * Get an object from S3 and save it as a file
 * 
 * @param {string} sourceObjectName Name of the object in S3 bucket - the saved file will have the same name
 * @param {string} destinationDirectory Location of the new file
 * @param {string} bucketName Name of the bucket that contains files in its root directory
 */
function saveBucketObject(sourceObjectName, destinationDirectory, bucketName, done) {
    var params = {
        Bucket: bucketName,
        Key: sourceObjectName
    };

    s3.getObject(params, function(err, data) {
        if (err) {
            console.log(err, err.stack);
            done();
        } else { 
            var file = fs.createWriteStream(destinationDirectory + sourceObjectName);
            var stream = s3.getObject(params).createReadStream().pipe(file);
            stream.on('finish', function () { done() });
        }
    });
}

/**
 * Downloads all files from the root directory of an S3 bucket
 * WARNING: The bucket can't contain subdirectories
 * 
 * @param {string} bucketName Name of the bucket containing files
 * @param {string} destinationDirectory Location for the downloaded files (may not exist)
 */
function downloadFiles(bucketName, destinationDirectory, done) {
    s3.listObjects({Bucket: bucketName}, function(err, data) {
        if (err) {
            console.log(err, err.stack);
            done();
        } else {
            createDirectoryIfNotExists(destinationDirectory);

            // needs to be called (data.Contents.length) times to call done()
            var finishIfAllSaved = _.after(data.Contents.length, done);

            data.Contents.forEach(function(file) {
                saveBucketObject(file.Key, destinationDirectory, bucketName, function() {
                    finishIfAllSaved(); // will trigger done() after last object was saved
                });
            });
        }
    });
}

exports.downloadFiles = downloadFiles;
