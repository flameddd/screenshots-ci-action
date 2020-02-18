const core = require('@actions/core');
const io = require("@actions/io");
const puppeteer = require("puppeteer");
const deviceDescriptors = require("puppeteer/lib/DeviceDescriptors");

const DEFAULT_DESKTOP_VIEWPOINT_RATIO = [
  { width: 540, height: 405 },
  { width: 600, height: 450 },
  { width: 720, height: 540 },
  { width: 960, height: 720 },
  { width: 1140, height: 640 },
  { width: 1280, height: 720 },
  { width: 1920, height: 1080 },
];

const deviceNames = deviceDescriptors.map(device => device.name);

async function run() {
  try { 

    const url = core.getInput("url") || "";
    const isAllDevices = core.getInput("allDevices") || false;
    let includedDevices = core.getInput("devices") || "";
    const noDesktop = core.getInput("noDesktop") === true;

    core.startGroup('Action config')
    console.log('Input args:', {
      url,
      noDesktop: noDesktop,
      allDevices: isAllDevices,
      devices: includedDevices,
    });
    core.endGroup() // Action config

    if (!url) {
      console.log([
        `Task done`,
        `- "url" is empty.`
      ].join('\n'))
      return;
    }

    includedDevices = includedDevices.split(',')

    let inValidedDevices = includedDevices
      .filter(name => !deviceNames.includes(name));
    inValidedDevices = inValidedDevices.map(name => `- "${name}"`);
    if (inValidedDevices.length) {
      console.error([
        "Following devices name are invalid:",
        ...inValidedDevices
      ].join('\n'))
    }

    includedDevices = includedDevices.filter(name => deviceNames.includes(name));

    if (noDesktop && !includedDevices.length) {
      console.log([
        `Task done`,
        `- No desktop and and devices are selected. You have chose at least one desktop or device.`
      ].join('\n'))
      return;
    }
    console.error('process.env.PUPPETEER_EXEC_PATH')
    console.error(process.env.PUPPETEER_EXEC_PATH)
    const launchOptions = !process.env.GITHUB_SHA
      ? {}
      : { executablePath: process.env.PUPPETEER_EXEC_PATH }
    const browser = await puppeteer.launch(launchOptions);
    
    const desktopPage = await browser.newPage();

    if (process.env.GITHUB_WORKSPACE) {
      await io.mkdirP(`${process.env.GITHUB_WORKSPACE}/screenshots/`);
    }

    const path = process.env.GITHUB_WORKSPACE
      ? `${process.env.GITHUB_WORKSPACE}/screenshots/`
      : `screenshots/`

    const postfix = process.env.GITHUB_SHA
      ? `${process.env.GITHUB_SHA}`.substr(0, 7)
      : `${new Date().getTime()}`

    if (!noDesktop) {
      core.startGroup("start process desktop")
      console.log("Processing desktop screenshot")
      await desktopPage.goto(url, { waitUntil: 'networkidle0' });
      for (const { width, height } of DEFAULT_DESKTOP_VIEWPOINT_RATIO) {
        await desktopPage.setViewport({ width, height });
        await desktopPage.screenshot({
          path: `${path}desktopPage${width}x${height}-${postfix}.png`
        });
      }
      core.endGroup() // end start process desktop
    }
    
    if (includedDevices.length) {
      core.startGroup("start process mobile devices");
      console.log("Processing mobile devices screenshot")
      const mobilePages = await Promise.all([
        ...Array.from({ length: includedDevices.length }).fill(browser.newPage()),
      ]);
      for (const [index, page] of mobilePages.entries()) {
        console.log('mobile for loop in ')
        await page.emulate(puppeteer.devices[`${includedDevices[index]}`])
        await page.goto(url, { waitUntil: 'networkidle0' });
        await page.screenshot({ path: `${path}${includedDevices[index].replace(/ /g, '_')}-${postfix}.png` });
      }
      core.endGroup() // end start process mobile devices
    }

    await browser.close();
    console.log('close')
  } 
  catch (error) {
    console.error(error)
    core.setFailed(error.message);
  }
}

run()
