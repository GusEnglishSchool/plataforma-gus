const { Client } = require('ssh2');

const conn = new Client();
const commands = `
cd /root/plataforma-gus
git pull
npm run build
pm2 start npm --name "plataforma" -- start
pm2 save
`;

console.log('Iniciando deploy automático no VPS...');

conn.on('ready', () => {
  console.log('Conectado ao VPS. Executando comandos...');
  conn.exec(commands, (err, stream) => {
    if (err) {
      console.error('Erro ao executar comandos:', err);
      conn.end();
      return;
    }
    
    stream.on('close', (code, signal) => {
      console.log(`\nDeploy finalizado com código ${code}.`);
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).on('error', (err) => {
  console.error('Erro na conexão SSH:', err);
}).connect({
  host: '179.198.102.60',
  port: 22,
  username: 'root',
  password: 'GustavoM123@'
});
