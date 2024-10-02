const request = require('supertest');
const app = require('../app');  // Your Express app
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');
const { ObjectId } = require('mongodb');

describe('Files Endpoints', () => {
    let validUserId;
    let validToken;
    let validFileId;

    beforeAll(async () => {
        await dbClient.connect();
        await redisClient.connect();

        // Assuming you have a valid user and file for testing
        validUserId = 'some-valid-user-id';  // Replace with a real user ID from your test database
        validToken = 'some-valid-token';      // Replace with a real token generated for the user
        const file = await dbClient.filesCollection.insertOne({
            name: 'test-file.txt',
            userId: validUserId,
            isPublic: false,
            type: 'file',
            localPath: 'path/to/test-file.txt',
            parentId: '0',
        });
        validFileId = file.insertedId.toString(); // Store the valid file ID for testing
    });

    afterAll(async () => {
        await dbClient.filesCollection.deleteMany({ userId: validUserId }); // Clean up test data
        await dbClient.close();
        await redisClient.disconnect();
    });

    test('GET /files/:id should return file by ID', async () => {
        const res = await request(app)
            .get(`/files/${validFileId}`)
            .set('X-Token', validToken);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('id', validFileId);
        expect(res.body).toHaveProperty('name', 'test-file.txt');
    });

    test('GET /files/:id should return 404 for non-existent file', async () => {
        const res = await request(app)
            .get('/files/invalid-file-id')
            .set('X-Token', validToken);

        expect(res.statusCode).toBe(404);
        expect(res.body).toHaveProperty('error', 'Not found');
    });

    test('GET /files should return list of files', async () => {
        const res = await request(app)
            .get('/files')
            .set('X-Token', validToken);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
    });

    test('PUT /files/:id/publish should publish the file', async () => {
        const res = await request(app)
            .put(`/files/${validFileId}/publish`)
            .set('X-Token', validToken);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('isPublic', true);
    });

    test('PUT /files/:id/unpublish should unpublish the file', async () => {
        const res = await request(app)
            .put(`/files/${validFileId}/unpublish`)
            .set('X-Token', validToken);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('isPublic', false);
    });

    test('GET /files/:id/data should return file data', async () => {
        const res = await request(app)
            .get(`/files/${validFileId}/data`)
            .set('X-Token', validToken);

        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toBe('text/plain'); // Adjust based on file type
    });

    test('GET /files/:id/data should return 404 for non-existent file', async () => {
        const res = await request(app)
            .get('/files/invalid-file-id/data')
            .set('X-Token', validToken);

        expect(res.statusCode).toBe(404);
        expect(res.body).toHaveProperty('error', 'Not found');
    });

    test('GET /files/:id/data should return 404 for non-public file without authorization', async () => {
        const res = await request(app)
            .get(`/files/${validFileId}/data`);

        expect(res.statusCode).toBe(404);
        expect(res.body).toHaveProperty('error', 'Not found');
    });
});
