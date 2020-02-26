const core = require('@actions/core');
const github = require('@actions/github');
var fs = require('fs');

async function init(github_token) {
  console.log("Initing!")

  const octokit = new github.GitHub(github_token);

  const repo_path = process.env.GITHUB_REPOSITORY
  const owner = repo_path.split('/')[0]
  const repo = repo_path.split('/')[1]
  const workflow = process.env.GITHUB_WORKFLOW
  const run_id = process.env.GITHUB_RUN_ID
  const run_number = process.env.GITHUB_RUN_NUMBER
  const actor = process.env.GITHUB_ACTOR
  const event_name = process.env.GITHUB_EVENT_NAME
  const event_path = process.env.GITHUB_EVENT_PATH
  console.log({
    repo: repo,
    workflow: workflow,
    run_id: run_id,
    run_number: run_number,
    actor: actor,
    event_name: event_name,
    event_path: event_path
  })

  // const { data: octo_workflow } = await octokit.actions.getWorkflow({
  //   owner,
  //   repo,
  //   workflow_id: run_id
  // });
  // console.log({ octo_workflow });

  const { data: octo_workflow_run } = await octokit.actions.getWorkflowRun({
    owner,
    repo,
    run_id
  });
  console.log({ octo_workflow_run });

  const { data: octo_jobs } = await octokit.actions.listJobsForWorkflowRun({
    owner,
    repo,
    run_id
  });
  console.log({ jobs: octo_jobs.jobs });

  var event = JSON.parse(fs.readFileSync(event_path, 'utf8'));
  console.log({ event })
}

async function run() {
  try {
    const slack_bot_token = core.getInput('slack_bot_token') || process.env.SLACK_BOT_TOKEN;
    const slack_channel = core.getInput('slack_channel') || process.env.SLACK_CHANNEL;
    const github_token = core.getInput('github_token') || process.env.GITHUB_TOKEN;

    if (!slack_bot_token) throw new Error("You must supply a SLACK_BOT_TOKEN")
    if (!slack_channel) throw new Error("You must supply a SLACK_CHANNEL")
    if (!github_token) throw new Error("You must supply a GITHUB_TOKEN")

    init(github_token)

    core.setOutput('updated_at', (new Date).toUTCString());
  }
  catch (error) {
    core.setFailed(error.message);
  }
}

run()
