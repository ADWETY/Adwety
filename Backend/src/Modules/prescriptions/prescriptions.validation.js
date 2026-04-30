const { z } = require('zod');
const scanSchema = z.object({
  body: z.object({ mock_text: z.string().max(5000).optional() }).strict(),
  query: z.object({}).strict(),
  params: z.object({}).strict(),
});
module.exports = { scanSchema };
