import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Taxi Booking API',
      version: '1.0.0',
      description: 'A comprehensive taxi booking application API with real-time features',
      contact: {
        name: 'API Support',
        email: 'support@taxibooking.com',
      },
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://your-production-domain.com/api' 
          : 'http://localhost:5000/api',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'User ID' },
            name: { type: 'string', description: 'User full name' },
            email: { type: 'string', format: 'email', description: 'User email address' },
            phone: { type: 'string', description: 'User phone number' },
            wallet_balance: { type: 'number', format: 'decimal', description: 'User wallet balance' },
            created_at: { type: 'string', format: 'date-time', description: 'Account creation date' },
          },
        },
        Driver: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'Driver ID' },
            user_id: { type: 'integer', description: 'Associated user ID' },
            license_number: { type: 'string', description: 'Driver license number' },
            vehicle_type: { type: 'string', enum: ['hatchback', 'sedan', 'suv'], description: 'Vehicle type' },
            vehicle_number: { type: 'string', description: 'Vehicle registration number' },
            current_lat: { type: 'number', format: 'double', description: 'Current latitude' },
            current_lng: { type: 'number', format: 'double', description: 'Current longitude' },
            is_available: { type: 'boolean', description: 'Driver availability status' },
            rating: { type: 'number', format: 'decimal', description: 'Driver rating' },
          },
        },
        Ride: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'Ride ID' },
            user_id: { type: 'integer', description: 'User ID who booked the ride' },
            driver_id: { type: 'integer', description: 'Driver ID assigned to the ride' },
            pickup_lat: { type: 'number', format: 'double', description: 'Pickup latitude' },
            pickup_lng: { type: 'number', format: 'double', description: 'Pickup longitude' },
            dropoff_lat: { type: 'number', format: 'double', description: 'Dropoff latitude' },
            dropoff_lng: { type: 'number', format: 'double', description: 'Dropoff longitude' },
            pickup_address: { type: 'string', description: 'Pickup address' },
            dropoff_address: { type: 'string', description: 'Dropoff address' },
            distance: { type: 'number', format: 'decimal', description: 'Ride distance in kilometers' },
            duration: { type: 'integer', description: 'Estimated ride duration in minutes' },
            base_fare: { type: 'number', format: 'decimal', description: 'Base fare amount' },
            surge_multiplier: { type: 'number', format: 'decimal', description: 'Surge pricing multiplier' },
            total_fare: { type: 'number', format: 'decimal', description: 'Total fare amount' },
            status: { 
              type: 'string', 
              enum: ['requested', 'accepted', 'picked_up', 'completed', 'cancelled'], 
              description: 'Ride status' 
            },
            created_at: { type: 'string', format: 'date-time', description: 'Ride booking time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            status: { type: 'string', description: 'Error status' },
            message: { type: 'string', description: 'Error message' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/*.js', './controllers/*.js'], // Path to the API files
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info { margin: 20px 0; }
      .swagger-ui .info .title { color: #2563eb; }
    `,
    customSiteTitle: "Taxi Booking API Documentation",
  }));

  // JSON endpoint for the swagger specs
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  console.log('📚 API Documentation available at /api-docs');
};

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User authentication and authorization
 *   - name: Rides
 *     description: Ride booking and management
 *   - name: Drivers
 *     description: Driver operations
 *   - name: Users
 *     description: User profile management
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               phone:
 *                 type: string
 *                 pattern: '^[+]?[(]?\d{10,15}$'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /rides/book:
 *   post:
 *     tags: [Rides]
 *     summary: Book a new ride
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pickup_lat
 *               - pickup_lng
 *               - dropoff_lat
 *               - dropoff_lng
 *               - vehicle_type
 *             properties:
 *               pickup_lat:
 *                 type: number
 *                 format: double
 *                 minimum: -90
 *                 maximum: 90
 *               pickup_lng:
 *                 type: number
 *                 format: double
 *                 minimum: -180
 *                 maximum: 180
 *               dropoff_lat:
 *                 type: number
 *                 format: double
 *                 minimum: -90
 *                 maximum: 90
 *               dropoff_lng:
 *                 type: number
 *                 format: double
 *                 minimum: -180
 *                 maximum: 180
 *               vehicle_type:
 *                 type: string
 *                 enum: [hatchback, sedan, suv]
 *               pickup_address:
 *                 type: string
 *                 maxLength: 200
 *               dropoff_address:
 *                 type: string
 *                 maxLength: 200
 *     responses:
 *       200:
 *         description: Ride booked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 rideId:
 *                   type: integer
 *                 estimatedFare:
 *                   type: number
 *                 availableDrivers:
 *                   type: integer
 *                 responseTime:
 *                   type: integer
 *                 parallelQueryTime:
 *                   type: integer
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

export default setupSwagger;
