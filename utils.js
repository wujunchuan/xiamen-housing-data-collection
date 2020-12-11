/*
 * Util
 * @Author: John Trump
 * @Date: 2020-12-11 17:41:00
 * @LastEditors: John Trump
 * @LastEditTime: 2020-12-11 18:02:56
 */
const fs = require('fs');
const path = require('path');
const { promisify } = require("util");

const dayjs = require("dayjs");
const axios = require("axios").default;

/**
 * Merge record, 根据日期去重
 * @param {array} older
 * @param {array} newer
 */
const mergeRecord = (older, newer) => {
  const obj = {};

  for (const item of older.concat(newer)) {
    obj[item.dateTime] = { ...item };
  }

  return Object.entries(obj).map(([dateTime, other]) => ({
    dateTime,
    ...other,
  }));
};

/** 结果写入json */
const writeToJSON = async (record) => {
  const yyyyMM = dayjs(new Date()).format("YYYY-MM");
  const fullPath = path.join("raw", `${yyyyMM}.json`);
  let records = [];
  // if exist, parse json to object
  if (await fs.existsSync(fullPath)) {
    const context = await promisify(fs.readFile)(fullPath);
    records = JSON.parse(context);
  }
  /* MergeRecord */
  records = mergeRecord(records, [{ ...record }]);
  // write to file
  await promisify(fs.writeFile)(fullPath, JSON.stringify(records, "", 2));
  return true;
};

/**
 * 获取图片并保存
 * @param {string} locate image path, exclude baseUrl
 * @param {string} baseUrl baseUrl, default is equal to {URL}
 */
const fetchImage = (locate, baseUrl) => {
  return new Promise(async (resolve) => {
    let fileName = locate.split("/")[2] || "unknown";
    const response = await axios.get(`${baseUrl}${locate}`, {
      responseType: "stream",
    });

    /* remove random stamp */
    fileName = fileName.replace(/(\?id=\-?\w+)/gm, "");

    response.data
      .pipe(fs.createWriteStream(`temp/${fileName}.png`))
      .on("finish", () => {
        resolve(fileName);
      });
  });
};

module.exports = {
  mergeRecord,
  writeToJSON,
  fetchImage
};
