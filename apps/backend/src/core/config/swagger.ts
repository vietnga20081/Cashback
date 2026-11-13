import swaggerJsdoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GreenCash API',
      version: '1.0.0',
      description: 'API documentation cho nền tảng Cashback Affiliate GreenCash',
      contact: { name: 'GreenCash Team', email: 'dev@greencash.vn' },
    },
    servers: [
      { url: '/api/v1', description: 'Current server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/modules/**/*.controller.ts', './src/api/v1/routes/*.ts'],
});
