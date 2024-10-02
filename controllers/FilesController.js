const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');
const { ObjectId } = require('mongodb');
const mime = require('mime-types');
const fs = require('fs');
const Bull = require('bull');

// Bull queue for file processing
const fileQueue = new Bull('fileQueue');

class FilesController {

    // GET /files/:id
    static async getShow(req, res) {
        const token = req.headers['x-token'];
        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const fileId = req.params.id;
        const file = await dbClient.filesCollection.findOne({ _id: new ObjectId(fileId), userId });
        if (!file) return res.status(404).json({ error: 'Not found' });

        res.status(200).json(file);
    }

    // GET /files
    static async getIndex(req, res) {
        const token = req.headers['x-token'];
        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const parentId = req.query.parentId || '0';
        const page = req.query.page || 0;
        const files = await dbClient.filesCollection.aggregate([
            { $match: { userId, parentId } },
            { $skip: page * 20 },
            { $limit: 20 }
        ]).toArray();

        res.status(200).json(files);
    }

    // PUT /files/:id/publish
    static async putPublish(req, res) {
        const token = req.headers['x-token'];
        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const fileId = req.params.id;
        const file = await dbClient.filesCollection.findOne({ _id: new ObjectId(fileId), userId });
        if (!file) return res.status(404).json({ error: 'Not found' });

        await dbClient.filesCollection.updateOne(
            { _id: new ObjectId(fileId) },
            { $set: { isPublic: true } }
        );

        res.status(200).json({ ...file, isPublic: true });
    }

    // PUT /files/:id/unpublish
    static async putUnpublish(req, res) {
        const token = req.headers['x-token'];
        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const fileId = req.params.id;
        const file = await dbClient.filesCollection.findOne({ _id: new ObjectId(fileId), userId });
        if (!file) return res.status(404).json({ error: 'Not found' });

        await dbClient.filesCollection.updateOne(
            { _id: new ObjectId(fileId) },
            { $set: { isPublic: false } }
        );

        res.status(200).json({ ...file, isPublic: false });
    }

    // GET /files/:id/data
    static async getFile(req, res) {
        const token = req.headers['x-token'];
        const userId = await redisClient.get(`auth_${token}`);
        const fileId = req.params.id;

        const file = await dbClient.filesCollection.findOne({ _id: new ObjectId(fileId) });
        if (!file) return res.status(404).json({ error: 'Not found' });

        if (!file.isPublic && (!userId || file.userId !== userId)) {
            return res.status(404).json({ error: 'Not found' });
        }

        if (file.type === 'folder') return res.status(400).json({ error: "A folder doesn't have content" });

        const filePath = `/tmp/files_manager/${file.localPath}`;
        const size = req.query.size;
        let fileWithSize = filePath;

        if (size) fileWithSize += `_${size}`;

        if (!fs.existsSync(fileWithSize)) return res.status(404).json({ error: 'Not found' });

        const mimeType = mime.lookup(file.name);
        res.setHeader('Content-Type', mimeType);
        res.sendFile(fileWithSize);
    }
}

module.exports = FilesController;
