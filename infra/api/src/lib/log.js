// Logs com o identificador da instância, para se perceber nos `docker compose logs`
// qual das 3 APIs fez o quê.
const { instanceId } = require('../config');

const stamp = () => new Date().toISOString();
const line = (lvl, msg) => `${stamp()} [${instanceId}] ${lvl} ${msg}`;

module.exports = {
    info: msg => console.log(line('INFO ', msg)),
    warn: msg => console.warn(line('WARN ', msg)),
    error: msg => console.error(line('ERROR', msg)),
};
