const core = require('@actions/core');
const io = require('@actions/io');
const github = require('@actions/github');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const telegram = require('./telegram.js');

const DEFAULT_DESKTOP_VIEWPOINT_RATIO = [
  { width: 540, height: 405 },
  { width: 600, height: 450 },
  { width: 720, height: 540 },
  { width: 960, height: 720 },
  { width: 1140, height: 640 },
  { width: 1280, height: 720 },
  { width: 1920, height: 1080 },
];

const DEFAULT_TYPE = 'jpeg';
const deviceNames = Object.keys(puppeteer.devices);
const PATH = process.env.GITHUB_WORKSPACE
  ? `${process.env.GITHUB_WORKSPACE}/screenshots/`
  : `screenshots/`;

const POST_FIX = process.env.GITHUB_SHA
  ? `${process.env.GITHUB_SHA}`.substr(0, 7)
  : `${new Date().getTime()}`;

const DEFAULT_WAITUNTIL_OPTION = 'networkidle0';
const WAITUNTIL_OPTIONS = [
  'load',
  'domcontentloaded',
  'networkidle0',
  'networkidle2',
];

const DEFAULT_WAIT_FOR_SELECTOR = '';
const DEFAULT_WAIT_FOR_SELECTOR_TIMEOUT = 30000; // 30 seconds

let browser;

async function run() {
  try {
    // 1. Get User config

    const url = core.getInput('url') || '';
    let includedDevices = core.getInput('devices') || '';
    const noDesktop = core.getInput('noDesktop') === 'true';
    const fullPage = core.getInput('fullPage') === 'true';
    const noCommitHashFileName =
      core.getInput('noCommitHashFileName') === 'true';

    let screenshotType = core.getInput('type') || DEFAULT_TYPE;
    screenshotType = screenshotType.toLowerCase();
    if (!['png', 'jpeg'].includes(screenshotType)) {
      screenshotType = DEFAULT_TYPE;
    }

    // "networkidle0" as default puppeteer default waitUntil option
    let waitUntil = core.getInput('waitUntil') || DEFAULT_WAITUNTIL_OPTION;
    if (!WAITUNTIL_OPTIONS.includes(waitUntil)) {
      waitUntil = DEFAULT_WAITUNTIL_OPTION;
    }

    let waitForSelector =
      core.getInput('waitForSelector') || DEFAULT_WAIT_FOR_SELECTOR;

    // get waitForSelectorOptions
    const waitForSelectorHidden = core.getBooleanInput('booleanInputName');
    const waitForSelectorVisible = core.getBooleanInput(
      'waitForSelectorVisible'
    );
    let waitForSelectorTimeout = core.getInput('waitForSelectorTimeout');
    if (Number.isNaN(waitForSelectorTimeout)) {
      waitForSelectorTimeout = DEFAULT_WAIT_FOR_SELECTOR_TIMEOUT;
    }
    const waitForSelectorOptions = {
      visible: waitForSelectorVisible,
      hidden: waitForSelectorHidden,
      timeout: waitForSelectorTimeout,
    };

    core.startGroup('Action config');
    console.log('Input args:', {
      url,
      noDesktop: noDesktop,
      devices: includedDevices,
      fullPage,
      type: screenshotType,
      waitUntil,
      waitForSelector,
      waitForSelectorOptions,
    });
    core.endGroup(); // Action config

    // 2. Verify User config

    if (!url) {
      console.log([`Task done`, `- "url" is empty.`].join('\n'));
      return;
    }

    includedDevices = includedDevices.split(',');

    let inValidedDevices = includedDevices.filter(
      (name) => !deviceNames.includes(name)
    );
    inValidedDevices = inValidedDevices.map((name) => `- "${name}"`);
    if (inValidedDevices.length) {
      console.error(
        ['Following devices name are invalid:', ...inValidedDevices].join('\n')
      );
    }

    includedDevices = includedDevices.filter((name) =>
      deviceNames.includes(name)
    );

    if (noDesktop && !includedDevices.length) {
      console.log(
        [
          `Task done`,
          `- No desktop and and devices are selected. You have chose at least one desktop or device.`,
        ].join('\n')
      );
      return;
    }

    // 3. Launch puppeteer

    const launchOptions = !process.env.GITHUB_SHA
      ? {}
      : {
          executablePath: 'google-chrome-stable',
          args: ['--no-sandbox'],
        };
    browser = await puppeteer.launch(launchOptions);

    const desktopPage = await browser.newPage();

    if (process.env.GITHUB_WORKSPACE) {
      await io.mkdirP(`${process.env.GITHUB_WORKSPACE}/screenshots/`);
    }

    // 4. Take desktop screenshots

    if (!noDesktop) {
      core.startGroup('start process desktop');
      console.log('Processing desktop screenshot');

      await desktopPage.goto(url, { waitUntil });
      // wait for page element when config has element selector
      if (waitForSelector) {
        try {
          await desktopPage.waitForSelector(
            waitForSelector,
            waitForSelectorOptions
          );
        } catch (error) {
          // waitForSelector timeout will throw error
          // Catch error to prevent flow break
          console.error(error);
        }
      }

      for (const { width, height } of DEFAULT_DESKTOP_VIEWPOINT_RATIO) {
        // filename with/without post fix commit hash name
        const desktopPath = noCommitHashFileName
          ? `${PATH}desktopPage${width}x${height}.${screenshotType}`
          : `${PATH}desktopPage${width}x${height}-${POST_FIX}.${screenshotType}`;

        await desktopPage.setViewport({ width, height });
        await desktopPage.screenshot({
          path: desktopPath,
          fullPage,
          type: screenshotType,
        });
      }
      core.endGroup(); // end start process desktop
    }

    // 5. Take mobile device screenshots

    if (includedDevices.length) {
      core.startGroup('start process mobile devices');
      console.log('Processing mobile devices screenshot');
      const mobilePages = await Promise.all([
        ...Array.from({ length: includedDevices.length }).fill(
          browser.newPage()
        ),
      ]);

      for (const [index, page] of mobilePages.entries()) {
        // filename with/without post fix commit hash name
        let mobilePath = `${PATH}${includedDevices[index].replace(/ /g, '_')}`;
        mobilePath = noCommitHashFileName
          ? `${mobilePath}.${screenshotType}`
          : `${mobilePath}-${POST_FIX}.${screenshotType}`;

        await page.emulate(puppeteer.devices[`${includedDevices[index]}`]);

        await page.goto(url, { waitUntil });
        // wait for page element when config has element selector
        if (waitForSelector) {
          try {
            await page.waitForSelector(waitForSelector, waitForSelectorOptions);
          } catch (error) {
            // waitForSelector timeout will throw error
            // Catch error to prevent flow break
            console.error(error);
          }
        }

        await page.screenshot({
          path: mobilePath,
          fullPage,
          type: screenshotType,
        });
      }
      core.endGroup(); // end start process mobile devices
    }

    await browser.close();

    // 6. Run screenshot post task
    await postProcesses();
  } catch (error) {
    console.error(error);
    core.setFailed(error.message);

    if (browser && browser.close) {
      await browser.close();
    }

    process.exit(1);
  }
}

// Comment files to PR
async function uploadAndCommnetImage(files) {
  try {
    const {
      repo: { owner, repo },
      payload: { pull_request },
    } = github.context;

    const releaseId = core.getInput('releaseId') || '';
    const octokit = github.getOctokit(process.env.GITHUB_TOKEN);

    const ISOTime = new Date().toISOString();

    const uploadedImage = [];
    for (const fileName of files) {
      try {
        // upload image file to release page
        const data = await fs.readFile(`${PATH}${fileName}`);
        const result = await octokit.rest.repos.uploadReleaseAsset({
          owner,
          repo,
          release_id: releaseId,
          name: `${ISOTime}-${fileName}`,
          data,
        });
        console.log('uploadReleaseAsset:', result);
        if (result.data.browser_download_url) {
          uploadedImage.push([
            `${ISOTime}-${fileName}`,
            result.data.browser_download_url,
          ]);
        }
      } catch (error) {
        console.error(`Failed to upload: ${fileName}`);
        console.error(error);
      }
    }

    if (uploadedImage.length) {
      try {
        /**
         * 1. template strings' tail new line (after img tag) is for space
         *    between next image
         * 2. template strings dont have indent is for comment layout
         */
        const body = uploadedImage
          .sort((a, b) => a[1].localeCompare(b[1]))
          .reduce(
            (body, [fileName, browser_download_url]) =>
              body +
              `## ${fileName}
- ${browser_download_url}

<img src=${browser_download_url} />

`,
            ''
          );

        const result = await octokit.rest.issues.createComment({
          owner,
          repo,
          issue_number: pull_request.number,
          body,
        });
        console.log('createComment:', result);
      } catch (error) {
        console.error(error);
      }
    }
  } catch (error) {
    console.error(error);
  }
}

async function postProcesses() {
  const files = await fs.readdir(PATH);
  if (!files.length) {
    return;
  }

  // Send files to telegram
  if (!!process.env.TELE_CHAT_ID && !!process.env.TELE_BOT_TOKEN) {
    await telegram({
      path: PATH,
      files,
      teleChatId: process.env.TELE_CHAT_ID,
      teltBotToken: process.env.TELE_BOT_TOKEN,
    });
  }

  // Commnet files to PR
  const {
    repo: { owner, repo },
    payload: { pull_request },
  } = github.context;
  const releaseId = core.getInput('releaseId') || '';

  if (
    !!owner &&
    !!repo &&
    !!pull_request &&
    !!releaseId &&
    process.env.GITHUB_TOKEN
  ) {
    await uploadAndCommnetImage(files);
  }
}

run();
