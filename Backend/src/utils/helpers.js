function makePagination(query = {}) {
  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.min(50, Math.max(1, Number(query.limit || 20)));
  return { page, limit, skip: (page - 1) * limit };
}
module.exports = { makePagination };
