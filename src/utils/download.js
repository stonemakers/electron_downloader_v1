import fs from 'fs';
import request from 'request';
import path from 'path';
import Store from 'electron-store';

const store = new Store();
let totalGlobalReceivedBytes = 0;  // 全局下载字节追踪
let lastCheckTime = Date.now();  // 上次检查时间
let activeDownloadThreads = 0;  // 活动下载线程计数

export default {
  calculateGlobalDownloadSpeed() {
    const currentTime = Date.now();
    const timeDifference = (currentTime - lastCheckTime) / 1000; // 秒
    const speedInBytesPerSec = totalGlobalReceivedBytes / timeDifference;  // bytes/s
    const speedInMBPerSec = (speedInBytesPerSec / (1024 * 1024)).toFixed(2);  // MB/s, 保留两位小数

    // 使用 isNaN 检查 speedInMBPerSec 是否为 NaN
    if (isNaN(speedInMBPerSec)) {
      return 0; // 如果是 NaN，则返回 0
    } else {
      totalGlobalReceivedBytes = 0;  // 重置
      lastCheckTime = currentTime;  // 更新上次检查时间
      return parseFloat(speedInMBPerSec); // 返回速度值（确保是数字）
    }
  },
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
      let tempPath = filePath + '.tmp';  // 创建一个临时文件路径

      // 在每次下载任务启动时，增加下载线程计数
      activeDownloadThreads++;

      if (url) {
        const headers = await this.getHeaders(url);

        if (headers['content-range']) {
          totalSize = Number(headers['content-range'].split('/')[1]);
        } else {
          totalSize = 0;
        }

        if (headers['accept-ranges'] !== 'bytes') {
          // console.log('Resource does not support resumable download');
          // Implement your handling here
        }

        const fullPath = path.join(store.get('downloadFold'), tempPath);

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
          totalGlobalReceivedBytes += chunk.length;  // 更新全局下载字节
        });

        req.on('end', function () {
          out.end();
          if (receivedBytes === totalSize) { // 检查文件是否完整
            fs.renameSync(fullPath, path.join(store.get('downloadFold'), filePath)); // 重命名临时文件
            resolve();
          } else if (retries > 0) { // 如果不完整且还有剩余重试次数
            console.log(`Retrying download... Remaining retries: ${retries}`);
            this.download(url, filePath, foldPath, retries - 1)
              .then(resolve)
              .catch(reject);
          } else {
            fs.unlink(fullPath, (unlinkErr) => {  // 删除不完整的文件
              if (unlinkErr) {
                console.error(`Failed to delete incomplete file: ${unlinkErr}`);
              }
            });
            reject(new Error('Failed after multiple retries'));
          }

          // 在每次下载任务完成后，减少下载线程计数
          activeDownloadThreads--;
        });

        out.on('finish', function () {
          resolve();
        });

        req.on('error', function (err) {
          out.close();
          fs.unlink(fullPath, (unlinkErr) => {  // 删除不完整的文件
            if (unlinkErr) {
              console.error(`Failed to delete incomplete file: ${unlinkErr}`);
            }
          });
          if (retries > 0) { // 有剩余重试次数
            console.log(`Retrying download... Remaining retries: ${retries}`);
            this.download(url, filePath, foldPath, retries - 1)
              .then(resolve)
              .catch(reject);
          } else {
            reject(err);
          }

          // 在每次下载任务完成后，减少下载线程计数
          activeDownloadThreads--;
        });

        out.on('error', function (err) {
          out.close();
          fs.unlink(fullPath, (unlinkErr) => {  // 删除不完整的文件
            if (unlinkErr) {
              console.error(`Failed to delete incomplete file: ${unlinkErr}`);
            }
          });
          reject(err);
        });
      } else {
        fs.mkdirSync(path.join(store.get('downloadFold'), foldPath), { recursive: true }, err => {
          console.log('Error when creating directory', err);
        });
        resolve();
      }
    });
  },

  // 获取当前活动下载线程数的函数
  getCurrentActiveDownloadThreads() {
    return activeDownloadThreads;
  }
}
