# waitForSelector example



```yaml
name: screenshots ci actions
on:
  push:
    branches:
    - master

jobs:
  screenshots:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: install puppeteer-headful
      uses: mujo-code/puppeteer-headful@master
      env:
        CI: 'true'
    - name: screenshots-ci-action
      uses: flameddd/screenshots-ci-action@master
      with:
        url: https://flameddd.github.io/screenshots-ci-action-test-waitForSelector/
        noDesktop: true
        devices: iPhone 6
        waitForSelector: '#waitForElement'
        waitForSelectorTimeout: 5000
    - uses: actions/upload-artifact@v2
      with:
        path: screenshots
        name: Download-screenshots
```
