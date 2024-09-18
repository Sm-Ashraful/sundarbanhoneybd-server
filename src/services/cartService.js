const fetchCartAndItems = async (userId) => {
  return JSON.parse(await cacheClient.get(userId));
};
