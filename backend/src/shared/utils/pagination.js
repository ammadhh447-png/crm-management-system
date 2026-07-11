const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

const parsePagination = (query = {}, defaults = {}) => {
  const page = Math.max(parseInt(query.page ?? defaults.page, 10) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(query.limit ?? defaults.limit, 10) || DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );
  const skip = (page - 1) * limit;

  const buildMeta = (total) => ({
    page,
    limit,
    total,
    totalPages: total > 0 ? Math.ceil(total / limit) : 1,
  });

  return { page, limit, skip, buildMeta };
};

module.exports = { parsePagination, DEFAULT_LIMIT, MAX_LIMIT };
