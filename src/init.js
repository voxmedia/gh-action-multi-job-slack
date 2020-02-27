const core = require('@actions/core')
const github = require('@actions/github')
const artifact = require('@actions/artifact')
const slack = require('slack')
const fs = require("fs")

const artifact_client = artifact.create()

const state_file = 'gh-action-multi-job-slack.json'

const styles = {
  "in_progress":  { sym: ":hourglass_flowing_sand:",  color: "#808080" },   // ⏳
  "started":      { sym: ":hourglass_flowing_sand:",  color: "#808080" },   // ⏳
  "success":      { sym: ":white_check_mark:",        color: "#33cc33" },   // ✅
  "canceled":     { sym: ":heavy_minus_sign:",        color: "#ff9900" },   // ➖
  "failed":       { sym: ":x:",                       color: "#ff0000" }    // ❌
}

const slack_bot_token = core.getInput('slack_bot_token') || process.env.SLACK_BOT_TOKEN;
const slack_channel = core.getInput('slack_channel') || process.env.SLACK_CHANNEL;
const github_token = core.getInput('github_token') || process.env.GITHUB_TOKEN;

function wait(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve("done!"), ms)
  });
}

function getBranchOrTag(target_type) {
  const ref = process.env.GITHUB_REF;
  if (!ref) return null
  const regexs = {
    branch: /refs\/heads\//,
    tag: /refs\/tags\//
  }
  const regex = regexs[target_type]
  if (ref.match(regex)) {
    return ref.replace(regex, '')
  } else {
    return null
  }
}

async function updateMessage(params, state) {
  const bot = new slack({ token: slack_bot_token })
  params.ts = state.ts
  bot.chat.update(params)
}

async function createMessage(params) {
  const bot = new slack({ token: slack_bot_token })
  bot.chat.postMessage(params).then(function(response) {
    createStateFile(response.message.ts)
    uploadeStateFile()
  })
}

function createStateFile(ts) {
  fs.writeFileSync(state_file, JSON.stringify({ ts }))
}

async function uploadeStateFile() {
  await artifact_client.uploadArtifact(state_file, [state_file], '.')
}

async function init() {
  console.log("Initing!")

  // Required for API requests
  const octokit = new github.GitHub(github_token)
  const repo_path = process.env.GITHUB_REPOSITORY
  const owner = repo_path.split('/')[0]
  const repo = repo_path.split('/')[1]
  const run_id = process.env.GITHUB_RUN_ID

  // Required for slack message
  const actor = process.env.GITHUB_ACTOR
  const event_name = process.env.GITHUB_EVENT_NAME
  const workflow = process.env.GITHUB_WORKFLOW
  const repo_name = process.env.GITHUB_REPOSITORY.split('/')[1]
  const sha = process.env.GITHUB_SHA

  // Init slack message
  const branch = getBranchOrTag('branch')
  const tag = getBranchOrTag('tag')
  const repo_url = `https://github.com/${repo_path}`
  const branch_url = `https://github.com/${repo_path}/tree/${branch}`
  const tag_url = `https://github.com/${repo_path}/releases/tag/${tag}`
  const ref_label = branch ? 'Branch' : 'Tag'
  const ref_link = branch ? `<${branch_url}|${branch}>` : `<${tag_url}|${tag}>`
  const headerBlock = {
    "type": "section",
    "fields": [
      { "type": "mrkdwn", "text": `*Repo:* <${repo_url}|${repo_name}>` },
      { "type": "mrkdwn", "text": `*${ref_label}:* ${ref_link}` },
      { "type": "mrkdwn", "text": `*Workflow:* <https://github.com/${repo_path}/commit/${sha}/checks?check_suite_id=${run_id}|${workflow}>` },
      { "type": "mrkdwn", "text": `*Actor:* <https://github.com/${actor}|${actor}>` }
    ]
  }

  await wait(parseInt(5000));
  const { data: { jobs: jobs } } = await octokit.actions.listJobsForWorkflowRun({
    owner,
    repo,
    run_id
  });

  const messages = jobs.map(function(job) {
    const style = styles[job.conclusion] || styles[job.status]
    return `${style.sym} ${job.name}`
  })

  // debug
  console.log({ messages })
  console.log({ jobs })

  const jobsBlock = {
    "type": "section",
    "text": {
      "type": "mrkdwn",
      "text": messages.join(' \n\n')
    }
  }

  const footerBlock = {
    "mrkdwn_in": ["text"],
    "color": "#cccccc",
    "fields": [],
    "footer": [
      `*Updated at:* ${new Date().toUTCString()} \n`,
      `*Execution time:* ${'tktktk'} \n`
    ].join('')
  }

  const params = {
    username: "GH Actions Bot",
    icon_url: "https://i.imgur.com/o3KKCib.png",
    channel: slack_channel,
    text: '',
    blocks: [ headerBlock, jobsBlock ],
    attachments: [ footerBlock ]
  }

  const resp = await artifact_client.downloadArtifact(state_file).catch(() => {})
  if (resp) {
    const state = JSON.parse(fs.readFileSync(state_file, 'utf8'))
    updateMessage(params, state)
    // * if possible, detect if all jobs complete * delete artifact
  } else {
    createMessage(params)
  }
}

process.on('unhandledRejection', error => {
  core.setFailed(` Unhandled Rejection: ${error.message}`)
});

async function run() {
  try {
    if (!slack_bot_token) throw new Error("You must supply a SLACK_BOT_TOKEN")
    if (!slack_channel) throw new Error("You must supply a SLACK_CHANNEL")
    if (!github_token) throw new Error("You must supply a GITHUB_TOKEN")

    init()

    core.setOutput('updated_at', (new Date).toUTCString());
  }
  catch (error) {
    core.setFailed(error.message);
  }
}

run()
