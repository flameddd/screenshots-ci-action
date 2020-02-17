# screenshots-ci-action
Generate a website screenshots in different viewpoint, devices.

## desktop ratio
- width: 540px, height: 405px
- width: 600px, height: 450px
- width: 720px, height: 540px
- width: 960px, height: 720px
- width: 1140px, height: 640px
- width: 1280px, height: 720px
- width: 1920px, height: 1080px

## mobile devices
e.x.
- 'Galaxy Note 3'
- 'Galaxy S III landscape'
- 'Galaxy S5'
- 'iPad Pro landscape'
- 'iPhone 6 Plus'
- 'iPhone X'
- 'iPhone X landscape'
- 'Kindle Fire HDX'
- 'Nexus 7'
- 'Pixel 2 XL'
- 'Pixel 2 XL landscape'

full mobile devices options
- https://github.com/puppeteer/puppeteer/blob/master/experimental/puppeteer-firefox/lib/DeviceDescriptors.js


# Examples
```yaml
name: screenshots ci actions
on:
  push:
    branches:
    - master

jobs:
  screenshots:
    runs-on: macos-latest
    steps:
    - uses: actions/checkout@v2
    - run: npm ci
    - uses: "flameddd/screenshots-ci-action@1"
      with:
        url: https://github.com
        devices: iPhone 6,iPhone 6 landscape,Nexus 7,Pad Pro,Galaxy S III landscape,iPad Pro landscape
    - uses: actions/upload-artifact@v1
      with:
        name: Download-screenshots
        path: screenshots
```
