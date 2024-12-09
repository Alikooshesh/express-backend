const requireApiKey = (req, res, next) => {
  const apiKey = req.header('api_key');
  
  if (!apiKey) {
    return res.status(401).json({ message: 'API key is required' });
  }
  
  req.api_key = apiKey;
  next();
};

module.exports = requireApiKey; 