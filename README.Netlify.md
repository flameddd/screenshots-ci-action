# Netlify Preview Deployment screenshots-ci-action

Unfortunately, seems **Netlify** doesn't support [deployment_status](https://docs.github.com/en/developers/webhooks-and-events/webhook-events-and-payloads#deployment_status) yet. **For now**, we can use others **Github Actions** to **workaround**


## tl;tr
### 1. find out your "pull request's netlify's Pages changed checkname
steps
1. go to one of **pull request**
2. go to **Checks** tab
3. there is a netlify checks on left list
4. copy "**Pages changed** ... " checkname
    - e.x. **"Pages changed - modest-spence-711b92"**

![image](https://user-images.githubusercontent.com/22259196/89117111-bf3c3680-d4cd-11ea-8b18-4a9b31040fb6.png)  
![image](https://user-images.githubusercontent.com/22259196/89117116-c82d0800-d4cd-11ea-8e09-ffaeb2d3b117.png)  

### 2. find out your **netlify** site name
steps
1. go to https://app.netlify.com/ and copy site name
    - e.x. modest-spence-711b92

![image](https://user-images.githubusercontent.com/22259196/89117145-20640a00-d4ce-11ea-934a-b9739354c217.png)


### 3. create ".github/workflows/screenshots.yml" on the root
steps
1. copy/past yaml example (in below) to **screenshots.yml**
2. replace **netlify_PAGE_CHANGED_CHECK_NAME** with your checkname (with single quote, bcuz checkName string have space)
    - e.x. `checkName: 'Pages changed - modest-spence-711b92'`
3. replace **netlify_SITE_NAME** with your site name
    - e.x. `site_name: 'modest-spence-711b92'`
4. (set your **screenshots-ci-action** config. example only for desktop screenshot)

![image](https://user-images.githubusercontent.com/22259196/89117298-463dde80-d4cf-11ea-9ed1-399be5fda0bd.png)


### finally
- create pull request
- Github Action will start, but waiting for netlify deploy and checks
  - if we push new commit, Github Action and netlify deploy will trigger again

### workflow yaml example
```yaml
name: Screenshots-ci

on: [pull_request]

jobs:
  screenshots:
    runs-on: ubuntu-latest
    steps:
    - name: Wait for Pages changed to neutral
      uses: fountainhead/action-wait-for-check@v1.0.0
      id: wait-for-Netlify
      with:
        token: ${{ secrets.GITHUB_TOKEN }}
        ref: ${{ github.event.pull_request.head.sha || github.sha }}
        checkName: netlify_PAGE_CHANGED_CHECK_NAME
    - name: Get Preview URL and generate screenshot after Netlify check done
      if: steps.wait-for-Netlify.outputs.conclusion == 'neutral'
      uses: jakepartusch/wait-for-netlify-action@v1
      id: waitFor200
      with:
        site_name: netlify_SITE_NAME
    - uses: actions/checkout@v2
    - name: install puppeteer-headful
      uses: mujo-code/puppeteer-headful@master
      env:
        CI: 'true'
    - name: screenshots-ci-action
      uses: flameddd/screenshots-ci-action@v1.1.0
      with:
        url: ${{ steps.waitFor200.outputs.url }}
    - uses: actions/upload-artifact@v2
      with:
        path: screenshots
        name: Download-screenshots
```

----------------------------------------------------------------------
## About **"jakepartusch/wait-for-netlify-action"** Action
- "wait-for-netlify-action" will wait and help us to find out "preview's url"
  - `${{ steps.waitFor200.outputs.url }}`
- unforturely, there is a Issue and not solve yet
  - [Does not reliably work when adding a commit to an existing deploy preview](https://github.com/JakePartusch/wait-for-netlify-action/issues/6)
  - issue URL: https://github.com/JakePartusch/wait-for-netlify-action/issues/6

So, I Use **"fountainhead/action-wait-for-check@"** Action try to solve it.  
And **action-wait-for-check** 's work looks fine !  

In the future, we can remove `fountainhead/action-wait-for-check` after [Issue #6](https://github.com/JakePartusch/wait-for-netlify-action/issues/6) solved

e.x. 
```yaml
name: Successful Deploy Action Example

on: [pull_request]

jobs:
  screenshots:
    runs-on: ubuntu-latest
    steps:
      - name: Waiting for 200 from the Netlify Preview
        uses: jakepartusch/wait-for-netlify-action@v1
        id: waitFor200
        with:
          site_name: netlify_SITE_NAME
    - uses: actions/checkout@v2
    ...
       with:
         url: ${{ steps.waitFor200.outputs.url }}
```


## About **"fountainhead/action-wait-for-check"** Action
- there are **four netlify check names**
  - Header rules - modest-spence-...
  - Pages changed - modest-spence-...
  - Redirect rules - modest-spence-...
  - Mixed content - modest-spence-...

I chose **'Pages changed'** as check target **by intuition**
- rest of checks seems do nothing
- I don't know why **'Pages changed'** check's final **conclusion** is **'neutral'**
  - why is not **'success'**, like **'Mixed content'** check

### The things I want to say is
**As long as your netlify USE CASE become more COMPLICATE in the future**
- maybe there will be another more appropriate **check name** can use (e.x. deploy check?)
- maybe the **conclusion** become **'success'**, but NOT **'neutral'**

bcuz I am totally **newbie in netlify**, I just want to mention those things I not sure
