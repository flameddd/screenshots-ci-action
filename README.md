# screenshots-ci-action
Generate a website screenshots in different viewpoint, devices.

## Parameters
		
| Name(type)  | required(default) | Description |  
| ------------- | ------------- | ------------- |    
| `url`(string)  |  **required**(`""`) | The target website's URL to generate screenshots |
| `devices`(string)  |  optional(`""`) | Specific mobile devices to generate screenshots. **Use comma(`,`) to separate devices name.** The devices name list in below. |
| `noDesktop`(boolean)  |  optional(`false`) | Set `true` if not require to get desktop viewpoint screenshots. |

# Config Examples (screenshot desktop and few specific devices)
1. At the root of your repository, create a directory named `.github/workflows` to store your workflow files.  

2. In `.github/workflows`, add a `.yml` or `.yaml` file for your workflow. For example, `.github/workflows/screenshots-workflow.yml`.

for more info
- https://help.github.com/en/actions/configuring-and-managing-workflows/configuring-a-workflow

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
      uses: flameddd/screenshots-ci-action@v1.0.2
      with:
        url: https://github.com
        devices: iPhone 6,iPhone 6 landscape,Nexus 7,Pad Pro,Galaxy S III landscape,iPad Pro landscape
    - uses: actions/upload-artifact@v1
      with:
        name: Download-screenshots
        path: screenshots
```

# Config Examples 2(screenshot iphone 6, without desktop)

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
      uses: flameddd/screenshots-ci-action@v1.0.2
      with:
        url: https://github.com
        devices: iPhone 6,iPhone 6 landscape
        noDesktop: true
    - uses: actions/upload-artifact@v1
      with:
        name: Download-screenshots
        path: screenshots
```

# Download screenshots (more result example in below)
![img](./asset/download_screenshots_01.jpg)  
![img](./asset/download_screenshots_02.jpg)  

## desktop: genrate all these ratio
- width: 540px, height: 405px
- width: 600px, height: 450px
- width: 720px, height: 540px
- width: 960px, height: 720px
- width: 1140px, height: 640px
- width: 1280px, height: 720px
- width: 1920px, height: 1080px

### full mobile devices options (https://github.com/puppeteer/puppeteer/blob/master/experimental/puppeteer-firefox/lib/DeviceDescriptors.js)
- 'Blackberry PlayBook'
- 'Blackberry PlayBook landscape'
- 'BlackBerry Z30'
- 'BlackBerry Z30 landscape'
- 'Galaxy Note 3'
- 'Galaxy Note 3 landscape'
- 'Galaxy Note II'
- 'Galaxy Note II landscape'
- 'Galaxy S III'
- 'Galaxy S III landscape'
- 'Galaxy S5'
- 'Galaxy S5 landscape'
- 'iPad'
- 'iPad landscape'
- 'iPad Mini'
- 'iPad Mini landscape'
- 'iPad Pro'
- 'iPad Pro landscape'
- 'iPhone 4'
- 'iPhone 4 landscape'
- 'iPhone 5'
- 'iPhone 5 landscape'
- 'iPhone 6'
- 'iPhone 6 landscape'
- 'iPhone 6 Plus'
- 'iPhone 6 Plus landscape'
- 'iPhone 7'
- 'iPhone 7 landscape'
- 'iPhone 7 Plus'
- 'iPhone 7 Plus landscape'
- 'iPhone 8'
- 'iPhone 8 landscape'
- 'iPhone 8 Plus'
- 'iPhone 8 Plus landscape'
- 'iPhone SE'
- 'iPhone SE landscape'
- 'iPhone X'
- 'iPhone X landscape'
- 'Kindle Fire HDX'
- 'Kindle Fire HDX landscape'
- 'LG Optimus L70'
- 'LG Optimus L70 landscape'
- 'Microsoft Lumia 550'
- 'Microsoft Lumia 950'
- 'Microsoft Lumia 950 landscape'
- 'Nexus 10'
- 'Nexus 10 landscape'
- 'Nexus 4'
- 'Nexus 4 landscape'
- 'Nexus 5'
- 'Nexus 5 landscape'
- 'Nexus 5X'
- 'Nexus 5X landscape'
- 'Nexus 6'
- 'Nexus 6 landscape'
- 'Nexus 6P'
- 'Nexus 6P landscape'
- 'Nexus 7'
- 'Nexus 7 landscape'
- 'Nokia Lumia 520'
- 'Nokia Lumia 520 landscape'
- 'Nokia N9'
- 'Nokia N9 landscape'
- 'Pixel 2'
- 'Pixel 2 landscape'
- 'Pixel 2 XL'
- 'Pixel 2 XL landscape'

## Result examples
### desktop (600x450)
![img](./asset/desktopPage600x450-6febe96.png)  

### desktop (960x720)
![img](./asset/desktopPage960x720-6febe96.png)  

### desktop (1140x640)
![img](./asset/desktopPage1140x640-6febe96.png)  

### desktop (1920x1080)
![img](./asset/desktopPage1920x1080-6febe96.png)  

### mobile (iPhone_6_landscape)
![img](./asset/iPhone_6_landscape-6febe96.png)  

### mobile (iPhone_6)
![img](./asset/iPhone_6-6febe96.png)  

### mobile (Nexus_7)
![img](./asset/Nexus_7-6febe96.png)  
