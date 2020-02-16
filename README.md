enable debug  

# todo
- test pass!!!!!!!!!!!!!!!!!
- desktop 的 breakpoint
- devices input
  - console.log not support device
  - after filter, is === 0, stop process
- output setting
  - local ?
  - github workspace
- 先準備 YML
- 有了 YML 才好把完整 flow 寫出來？
- 檢查 url,devices + desktop
- 還要確實把 message 給 console log 出來
  - 如果 url 無法訪問，那要 show 什麼訊息？

readme 說明
- yaml 範例
  - 執行的 screenshot
  - 執行結果的 screenshot
- 變數說明
  - networkidle0: consider navigation to be finished when there are no more than 0 network connections for at least 500 ms.
  - desktop 就 default included （要說明）

test case
- fail url
- only desktop
- desktop false
- devices []
- 交互判斷

```yaml

jobs:
  screenshots:
    runs-on: ubuntu-latest
    steps:
    - name: screenshots ci actions
      uses: "flameddd/screenshots-ci-action@v1"
      with:
        url: https://github.com
        noDesktop: false
        allDevices: true
        devices:
          - iPhone 6
          - iPhone 6 landscape
          - Nexus 7
          - Pad Pro
          - Galaxy S III landscape
          - iPad Pro landscape

```



# ref
- https://github.com/lannonbr/puppeteer-screenshot-action/blob/master/index.js

<p align="center">
  <a href="https://github.com/actions/javascript-action/actions"><img alt="javscript-action status" src="https://github.com/actions/javascript-action/workflows/units-test/badge.svg"></a>
</p>

# Create a JavaScript Action

Use this template to bootstrap the creation of a JavaScript action.:rocket:

This template includes tests, linting, a validation workflow, publishing, and versioning guidance.  

If you are new, there's also a simpler introduction.  See the [Hello World JavaScript Action](https://github.com/actions/hello-world-javascript-action)

## Create an action from this template

Click the `Use this Template` and provide the new repo details for your action

## Code in Master

Install the dependencies  
```bash
$ npm install
```

Run the tests :heavy_check_mark:  
```bash
$ npm test

 PASS  ./index.test.js
  ✓ throws invalid number (3ms)
  ✓ wait 500 ms (504ms)
  ✓ test runs (95ms)

...
```

## Change action.yml

The action.yml contains defines the inputs and output for your action.

Update the action.yml with your name, description, inputs and outputs for your action.

See the [documentation](https://help.github.com/en/articles/metadata-syntax-for-github-actions)

## Change the Code

Most toolkit and CI/CD operations involve async operations so the action is run in an async function.

```javascript
const core = require('@actions/core');
...

async function run() {
  try { 
      ...
  } 
  catch (error) {
    core.setFailed(error.message);
  }
}

run()
```

See the [toolkit documentation](https://github.com/actions/toolkit/blob/master/README.md#packages) for the various packages.

## Package for distribution

GitHub Actions will run the entry point from the action.yml. Packaging assembles the code into one file that can be checked in to Git, enabling fast and reliable execution and preventing the need to check in node_modules.

Actions are run from GitHub repos.  Packaging the action will create a packaged action in the dist folder.

Run package

```bash
npm run package
```

Since the packaged index.js is run from the dist folder.

```bash
git add dist
```

## Create a release branch

Users shouldn't consume the action from master since that would be latest code and actions can break compatibility between major versions.

Checkin to the v1 release branch

```bash
$ git checkout -b v1
$ git commit -a -m "v1 release"
```

```bash
$ git push origin v1
```

Your action is now published! :rocket: 

See the [versioning documentation](https://github.com/actions/toolkit/blob/master/docs/action-versioning.md)

## Usage

You can now consume the action by referencing the v1 branch

```yaml
uses: actions/javascript-action@v1
with:
  milliseconds: 1000
```

See the [actions tab](https://github.com/actions/javascript-action/actions) for runs of this action! :rocket:
