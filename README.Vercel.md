# Vercel Preview Deployment screenshots-ci-action

Thanks for **Github** and **Vercel(Zeit)** hard work and great **collaboration**. We can hook **Vercel's preview deployment** via [deployment_status](https://docs.github.com/en/developers/webhooks-and-events/webhook-events-and-payloads#deployment_status) event   

# Config Examples
- screenshot desktop for every **Vercel Preview Deployment**

```yaml
# .github/workflows/example_screenshots-ci-action.yml
name: screenshots-ci-action Example
on: deployment_status
jobs:
  build:
    if: github.event.deployment_status.state == 'success'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: install puppeteer-headful
        uses: mujo-code/puppeteer-headful@master
        env:
          CI: 'true'
      - name: screenshots-ci-action
        uses: flameddd/screenshots-ci-action@v1.1.0
        with:
          url: ${{ github.event.deployment_status.target_url }}
      - uses: actions/upload-artifact@v2
        with:
          path: screenshots
          name: Download-screenshots
```
