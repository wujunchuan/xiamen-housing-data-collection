/*
 * OCR support
 * @Author: John Trump
 * @Date: 2020-12-11 17:46:24
 * @LastEditors: John Trump
 * @LastEditTime: 2020-12-11 18:03:17
 */
const path = require("path");

/* https://www.npmjs.com/package/tesseract.js */
const { createWorker, PSM } = require("tesseract.js");
const gm = require('gm');

/** tesseract worker */
const worker = createWorker({
  logger: (m) => {
    process.env.NODE_ENV === "production" ? undefined : console.log(m);
  },
});

/** 对图片进行处理, 以便可以 tesseract 可以更好的识别图片 */
const reviseImg = (src) => {
  return new Promise((resolve, reject) => {
    /* set `.gm.jpg` flag to mark as handled picture */
    let output = src.replace(/(\.\w+)$/, ".gm.jpg");
    gm(src)
      .resample(300, 300) // set dpi to 300
      .flatten()
      .threshold(22, "%") // Binarization
      .write(output, (err) => (err ? reject(err) : resolve(output)));
  });
};

/**
 * 提取文字内容
 * @param {'clfjyimg' | 'spftjimg' | 'spfjsimg'} fileName 文件名称
 */
const ocrImage = (fileName) => {
  // 一手房分区情况 spfjsimg.png
  // 一手房整体情况 spftjimg.png
  // 二手房备案情况 clfjyimg.png
  return new Promise(async (resolve, reject) => {
    try {
      let image = path.resolve(__dirname, `./temp/${fileName}.png`);
      try {
        image = await reviseImg(image);
      } catch (err) {
        console.log(err);
      }
      console.log(`Recognizing ${image}`);
      await worker.load();
      await worker.loadLanguage("eng");
      await worker.initialize("eng");
      await worker.setParameters({
        tessedit_char_whitelist: "0123456789-,.:",
        tessedit_char_blacklist: "abcdefghigklmnopqrstuvwxyz",
        tessedit_pageseg_mode: PSM.SPARSE_TEXT,
      });
      const {
        data: { text },
      } = await worker.recognize(image);
      resolve(text);
    } catch (error) {
      reject(error);
    } finally {
      await worker.terminate();
    }
  });
};

module.exports = {
  ocrImage,
};
