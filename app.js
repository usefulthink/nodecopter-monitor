var arDrone = require('ar-drone'),
    client = arDrone.createClient();

require('./index.js').init(client);
