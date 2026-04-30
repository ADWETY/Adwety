const { z } = require('zod');
const scanSchema = z.object({ body: z.object({ mock_text: z.string().optional() }).passthrough(), query: z.object({}).passthrough(), params: z.object({}).passthrough() });
module.exports = { scanSchema };
