const axios = require("axios");
const fs = require("fs");
const XLSX = require("xlsx");
const path = require("path");

async function getAccessToken(appId, appSecret) {
  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
  try {
    const response = await axios.get(url);
    return response.data.access_token;
  } catch (error) {
    console.error("Error getting access token:", error);
    return null;
  }
}

async function createWxaCode(access_token, path, savePath) {
  const url = `https://api.weixin.qq.com/wxa/getwxacode?access_token=${access_token}`;
  const params = {
    path: path,
    width: 1280,
    env_version: "release",
  };
  try {
    const response = await axios.post(url, params, {
      responseType: "arraybuffer",
    });
    fs.writeFileSync(savePath, response.data);
    console.log(`Saved wxacode to ${savePath}`);
  } catch (error) {
    console.error("Error creating wxacode:", error);
  }
}

function extractUtmCampaign(path) {
  const urlParams = new URLSearchParams(path?.split("?")[1]);
  return (
    `${urlParams.get("utm_campaign")}_${urlParams.get("vehicleClass")}` || "default" //示例为从路径参数中取值作为文件名
  );
}

function readUrlListFromXlsx() {
  const workbook = XLSX.readFile("list.xlsx");
  const sheet = workbook.Sheets["Sheet1"];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    // return columnArray = data.map(row => row[3]); //假设你想转化的列是第一列（索引为0）
  return (columnArray = data.slice(0, 7).map((row) => row[3])); //从第3列选择第1行到第6行的数据。
}

function ensureDirectoryExists(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.rmSync(folderPath, { recursive: true });
    console.log(`Removed existing file: ${folderPath}`);
  }
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
}

async function main() {
  const folderName = "folder_name";
  ensureDirectoryExists(folderName);
  const appId = "wx------------"; // 替换为你的AppID
  const appSecret = "app-secret"; // 替换为你的AppSecret
  const accessToken = await getAccessToken(appId, appSecret);

  if (accessToken) {
    const pagePaths = readUrlListFromXlsx(); // 你的小程序页面路径列表
    pagePaths.forEach((url) => {
      ensureDirectoryExists(folderName);
      const savePath = path.join(folderName, `${extractUtmCampaign(url)}.png`);
      createWxaCode(accessToken, url, savePath);
    });
  }
}

main();
