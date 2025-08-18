const swaggerAutoGen = require('swagger-autogen')({opneapi: '3.0.0'});

const doc = {
  info: {
    title: 'API Documentation',
    description: 'API documentation for the project',
  },
  host: 'localhost:3000',
};

const outputFile = './swagger_output.json';
const endpointsfiles = ['../server.js', '../dataBase/mongo.js'];

swaggerAutoGen(outputFile, endpointsfiles, doc);