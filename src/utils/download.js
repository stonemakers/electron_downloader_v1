import fs from 'fs';
import request from 'request';
import path from 'path';
import Store from 'electron-store';
const store = new Store();

export default {
  getHeaders(url) {
    return new Promise((resolve, reject) => {
      request(
        {
          url: url,
          method: 'GET',
          forever: true,
          headers: {
            'Cache-Control': 'no-cache',
            Range: 'bytes=0-1'
          }
        },
        (err, res) => {
          if (err) {
            reject(err);
          } else {
            resolve(res.headers);
          }
        }
      );
    });
  },

  async download(url, filePath, foldPath, retries = 3) {
    return new Promise(async (resolve, reject) => {
      let req;
      let out;
      let totalSize = 0;
      let receivedBytes = 0;

      if (url) {
        const headers = await this.getHeaders(url);

        if (headers['content-range']) {
          totalSize = Number(headers['content-range'].split('/')[1]);
        } else {
          totalSize = 0;
        }

        if (headers['accept-ranges'] !== 'bytes') {
          console.log('Resource does not support resumable download');
          // Implement your handling here
        }

        const fullPath = path.join(store.get('downloadFold'), filePath);

        let stat;
        if (fs.existsSync(fullPath)) {
          stat = fs.statSync(fullPath);
          receivedBytes = stat.size;

          if (receivedBytes === totalSize) {
            resolve();
          }
          if (receivedBytes > totalSize) {
            resolve();
          }
        } else {
          fs.mkdirSync(path.join(store.get('downloadFold'), foldPath), { recursive: true }, err => {
            console.log('Error when creating directory', err);
          });
        }

        req = request({
          method: 'GET',
          url: url,
          forever: true,
          headers: {
            'Cache-Control': 'no-cache',
            Range: `bytes=${receivedBytes}-${totalSize - 1}`
          }
        });

        out = fs.createWriteStream(fullPath, {
          flags: 'a'
        });

        req.pipe(out);

        req.on('data', function (chunk) {
          receivedBytes += chunk.length;
        });

        req.on('end', function () {
          out.end();
          if (receivedBytes === totalSize) { // 检查文件是否完整
            resolve();
          } else if (retries > 0) { // 如果不完整且还有剩余重试次数
            console.log(`Retrying download... Remaining retries: ${retries}`);
            this.download(url, filePath, foldPath, retries - 1)
              .then(resolve)
              .catch(reject);
          } else {
            reject(new Error('Failed after multiple retries'));
          }
        });

        out.on('finish', function () {
          resolve();
        });

        req.on('error', function (err) {
          out.close();
          if (retries > 0) { // 有剩余重试次数
            console.log(`Retrying download... Remaining retries: ${retries}`);
            this.download(url, filePath, foldPath, retries - 1)
              .then(resolve)
              .catch(reject);
          } else {
            reject(err);
          }
        });

        out.on('error', function (err) {
          out.close();
          reject(err);
        });
      } else {
        fs.mkdirSync(path.join(store.get('downloadFold'), foldPath), { recursive: true }, err => {
          console.log('Error when creating directory', err);
        });
        resolve();
      }
    });
  }
}
