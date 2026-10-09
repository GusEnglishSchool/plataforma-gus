const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const readStream = fs.createReadStream('.env.local');
    const writeStream = sftp.createWriteStream('/root/plataforma-gus/.env.local');
    
    writeStream.on('close', () => {
      console.log('Arquivo .env.local transferido com sucesso!');
      conn.exec('cd /root/plataforma-gus && pm2 restart plataforma --update-env', (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
          console.log('Servidor reiniciado.');
          conn.end();
        }).on('data', (data) => {
          process.stdout.write(data);
        }).stderr.on('data', (data) => {
          process.stderr.write(data);
        });
      });
    });
    
    readStream.pipe(writeStream);
  });
}).connect({
  host: '179.198.102.60',
  port: 22,
  username: 'root',
  password: 'GustavoM123@'
});
