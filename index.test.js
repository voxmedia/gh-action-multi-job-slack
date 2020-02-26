const process = require('process');
const child_process = require('child_process');
const path = require('path');


// For some reasons, these all fail with:
//    "Command failed: node /Users/jason.ormand/Projects/gh-action-multi-job-slack/index.js"
// ^^ Should fix ^^

// test('Run with SLACK_CHANNEL unset', () => {
//   process.env['INPUT_SLACK_BOT_TOKEN'] = "ABC123"
//   expect(function(){
//     child_process.execSync(`node ${path.join(__dirname, 'index.js')}`)
//   }).toThrow("You must supply a SLACK_CHANNEL");
// })

// test('Run with SLACK_BOT_TOKEN unset', () => {
//   process.env['INPUT_SLACK_CHANNEL'] = "ABC123"
//   expect(function(){
//     child_process.execSync(`node ${path.join(__dirname, 'index.js')}`)
//   }).toThrow("You must supply a SLACK_BOT_TOKEN");
// })

// test('Run with Slack envs set', () => {
//   process.env['INPUT_SLACK_BOT_TOKEN'] = "ABC123"
//   process.env['INPUT_SLACK_CHANNEL'] = "CTX8NCU9Z"
//   const cmd_result = child_process.execSync(`node ${path.join(__dirname, 'index.js')}`).toString('utf8');
//   expect(cmd_result).toMatch("GMT");
// })
