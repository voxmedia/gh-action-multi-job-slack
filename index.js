const core = require('@actions/core');


// most @actions toolkit packages have async methods
async function run() {
  try {
    const slack_bot_token = process.env.SLACK_BOT_TOKENZ;
    const slack_channel = process.env.SLACK_CHANNEL;

    if (!slack_bot_token) throw new Error("You must supply a SLACK_BOT_TOKEN")
    if (!slack_channel) throw new Error("You must supply a SLACK_CHANNEL")

    core.setOutput('updated_at', (new Date).toUTCString());
  }
  catch (error) {
    core.setFailed(error.message);
  }
}

run()
