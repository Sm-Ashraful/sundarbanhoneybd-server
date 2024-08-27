// * UTILITY FUNCTIONS

const generateGrantToken = async () => {
  try {
    const { data } = await axios.post(process.env);
  } catch (error) {
    throw new ApiError(500, "Error while generating paypal auth token");
  }
};
