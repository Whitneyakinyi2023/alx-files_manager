const Bull = require('bull');
const dbClient = require('./utils/db');
const imageThumbnail = require('image-thumbnail');
const fs = require('fs');
const path = require('path');

// Create a queue
const fileQueue = new Bull('fileQueue');

// Process the queue
fileQueue.process(async (job) => {
    const { fileId, userId } = job.data;

    if (!fileId) throw new Error('Missing fileId');
    if (!userId) throw new Error('Missing userId');

    const file = await dbClient.filesCollection.findOne({ _id: new ObjectId(fileId), userId });
    if (!file) throw new Error('File not found');

    const filePath = path.join('/tmp/files_manager', file.localPath);
    if (!fs.existsSync(filePath)) throw new Error('File not found on disk');

    // Generate thumbnails
    const sizes = [500, 250, 100];
    for (const size of sizes) {
        const thumbnail = await imageThumbnail(filePath, { width: size });
        fs.writeFileSync(`${filePath}_${size}`, thumbnail);
    }
});
