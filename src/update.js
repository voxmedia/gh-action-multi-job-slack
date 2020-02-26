const core = require('@actions/core');
const github = require('@actions/github');

function update(){
  console.log("Updating!")
}

async function run() {
  try {
    const slack_bot_token = core.getInput('slack_bot_token') || process.env.SLACK_BOT_TOKEN;
    const slack_channel = core.getInput('slack_channel') || process.env.SLACK_CHANNEL;
    const github_token = core.getInput('github_token') || process.env.GITHUB_TOKEN;

    if (!slack_bot_token) throw new Error("You must supply a SLACK_BOT_TOKEN")
    if (!slack_channel) throw new Error("You must supply a SLACK_CHANNEL")
    if (!github_token) throw new Error("You must supply a GITHUB_TOKEN")

    update()

    core.setOutput('updated_at', (new Date).toUTCString());
  }
  catch (error) {
    core.setFailed(error.message);
  }
}

run()
