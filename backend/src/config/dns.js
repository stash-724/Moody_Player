const dns = require('dns');

// Optional override for machines whose local resolver can't answer the SRV
// lookups that mongodb+srv:// URIs need (seen with Node on some Windows setups).
function applyDnsOverride() {
  if (process.env.DNS_SERVERS) {
    dns.setServers(process.env.DNS_SERVERS.split(',').map((s) => s.trim()));
  }
}

module.exports = applyDnsOverride;
