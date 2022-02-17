const fs = require('fs')
const puppeteer = require('puppeteer')
const lighthouse = require('lighthouse/lighthouse-core/fraggle-rock/api.js')

async function captureReport() {
  const browser = await puppeteer.launch({args: ['--allow-no-sandbox-job', '--allow-sandbox-debugging', '--no-sandbox', '--disable-gpu', '--disable-gpu-sandbox', '--display', '--ignore-certificate-errors', '--disable-storage-reset=true']});
  const page = await browser.newPage();
  // Get a session handle to be able to send protocol commands to the page.
  const session = await page.target().createCDPSession();

  const testUrl = 'https://pie-charmed-treatment.glitch.me/';
  const flow = await lighthouse.startFlow(page, {name: 'CLS during navigation and on scroll'});

  // Regular Lighthouse navigation.
  await flow.navigate(testUrl, {stepName: 'Navigate Only'});

  // Navigate and scroll timespan.
  await flow.startTimespan({stepName: 'Navigate and scroll'});
  await page.goto(testUrl, {waitUntil: 'networkidle0'});
  // We need the ability to scroll like a user. There's not a direct puppeteer function for this, but we can use the DevTools Protocol and issue a Input.synthesizeScrollGesture event, which has convenient parameters like repetitions and delay to somewhat simulate a more natural scrolling gesture.
  // https://chromedevtools.github.io/devtools-protocol/tot/Input/#method-synthesizeScrollGesture
  await session.send('Input.synthesizeScrollGesture', {
    x: 100,
    y: 0,
    yDistance: -2500,
    speed: 1000,
    repeatCount: 2,
    repeatDelayMs: 250,
  });
  await flow.endTimespan();

  await browser.close();

  const reportPath = __dirname + '/user-flow.report.html';
  const reportPathJson = __dirname + '/user-flow.report.json';

  const report = flow.generateReport();
  const reportJson = JSON.stringify(flow.getFlowResult()).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
 
  fs.writeFileSync(reportPath, report);
  fs.writeFileSync(reportPathJson, reportJson);
}

captureReport();