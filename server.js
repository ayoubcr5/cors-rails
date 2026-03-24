// Listen on a specific host via the HOST environment variable
var host = process.env.HOST || '0.0.0.0';
// Listen on a specific port via the PORT environment variable
var port = process.env.PORT || 8080;

// Helper to parse comma-separated environment variables
function parseEnvList(env) {
  if (!env) {
    return [];
  }
  return env.split(',');
}

// ORIGIN WHITELIST CONFIGURATION
// We include both the apex domain and the www subdomain for compatibility.
var originWhitelist = [
  'https://starnhl.com',
  'http://starnhl.com',
  'https://www.starnhl.com',
  'http://www.starnhl.com'
];

// If you still want the ability to add more via environment variables later, 
// you can merge them like this:
var extraOrigins = parseEnvList(process.env.CORSANYWHERE_WHITELIST);
originWhitelist = originWhitelist.concat(extraOrigins);

var originBlacklist = parseEnvList(process.env.CORSANYWHERE_BLACKLIST);

// Set up rate-limiting to avoid abuse
var checkRateLimit = require('./lib/rate-limit')(process.env.CORSANYWHERE_RATELIMIT);

var cors_proxy = require('./lib/cors-anywhere');
cors_proxy.createServer({
  originBlacklist: originBlacklist,
  originWhitelist: originWhitelist, // Only allows requests from starnhl.com
  requireHeader: ['origin', 'x-requested-with'],
  checkRateLimit: checkRateLimit,
  removeHeaders: [
    'cookie',
    'cookie2',
    'x-request-start',
    'x-request-id',
    'via',
    'connect-time',
    'total-route-time',
  ],
  redirectSameOrigin: true,
  httpProxyOptions: {
    // Do not add X-Forwarded-For, etc. headers, because Heroku/Proxies usually add them.
    xfwd: false,
  },
}).listen(port, host, function() {
  console.log('CORS Anywhere is strictly locked to: ' + originWhitelist.join(', '));
  console.log('Running on ' + host + ':' + port);
});
