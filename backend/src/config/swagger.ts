import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SETDIT API',
      version: '1.0.0',
      description: 'Sistem Terpadu - Sistem Informasi Kearsipan Terpadu API Documentation',
      contact: {
        email: 'admin@setdit.local',
      },
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Development server' },
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
            id: { type: 'integer' },
            fullname: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED'] },
            is_verified: { type: 'boolean' },
            position_id: { type: 'integer', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Role: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            code: { type: 'string' },
            description: { type: 'string' },
            is_super_admin: { type: 'boolean' },
            is_active: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Permission: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            code: { type: 'string' },
            module: { type: 'string' },
            action: { type: 'string' },
            is_active: { type: 'boolean' },
          },
        },
        Position: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            code: { type: 'string' },
            role_id: { type: 'integer', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Unit: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            code: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Menu: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            path: { type: 'string' },
            icon: { type: 'string' },
            module: { type: 'string' },
            order_num: { type: 'integer' },
            is_active: { type: 'boolean' },
          },
        },
        SKPerhutanan: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            nomor_register: { type: 'string' },
            nomor_nd: { type: 'string', nullable: true },
            nomor_sk: { type: 'string', nullable: true },
            provinsi_id: { type: 'integer' },
            kabkota_id: { type: 'integer' },
            skema_id: { type: 'integer' },
            pemohon_nama: { type: 'string' },
            pemohon_alamat: { type: 'string' },
            luas_ha: { type: 'number' },
            status: { type: 'string' },
            step: { type: 'string' },
            created_by: { type: 'integer' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: {} },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                totalPages: { type: 'integer' },
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {},
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User management endpoints' },
      { name: 'Roles', description: 'Role management endpoints' },
      { name: 'Permissions', description: 'Permission management endpoints' },
      { name: 'Positions', description: 'Position/Jabatan management endpoints' },
      { name: 'Units', description: 'Unit kerja management endpoints' },
      { name: 'Settings', description: 'Application settings endpoints' },
      { name: 'Menus', description: 'Menu management endpoints' },
      { name: 'Logs', description: 'Activity and audit log endpoints' },
      { name: 'WhatsApp', description: 'WhatsApp integration endpoints' },
      { name: 'Jadwal Pimpinan', description: 'Executive schedule management endpoints' },
      { name: 'Pegawai', description: 'Employee management endpoints' },
      { name: 'Provinsi', description: 'Province master data endpoints' },
      { name: 'Kabupaten/Kota', description: 'Regency/City master data endpoints' },
      { name: 'Skema', description: 'Scheme master data endpoints' },
      { name: 'SK Perhutanan', description: 'Forestry SK management endpoints' },
    ],
  },
  apis: ['./src/modules/**/routes.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
