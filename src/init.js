const core = require('@actions/core');
const github = require('@actions/github');
const slack = require('slack')

const symbols = {
  "in_progress":  { sym: ":hourglass_flowing_sand:",  color: "#808080" },   // ⏳
  "started":      { sym: ":hourglass_flowing_sand:",  color: "#808080" },   // ⏳
  "success":      { sym: ":white_check_mark:",        color: "#33cc33" },   // ✅
  "canceled":     { sym: ":heavy_minus_sign:",        color: "#ff9900" },   // ➖
  "failed":       { sym: ":x:",                       color: "#ff0000" }    // ❌
}

const slack_bot_token = core.getInput('slack_bot_token') || process.env.SLACK_BOT_TOKEN;
const slack_channel = core.getInput('slack_channel') || process.env.SLACK_CHANNEL;
const github_token = core.getInput('github_token') || process.env.GITHUB_TOKEN;

function getBranchOrTag(target_type) {
  const ref = process.env.GITHUB_REF;
  if (!ref) return null
  const regexs = {
    branch: /refs\/head\//,
    tag: /refs\/tags\//
  }
  const regex = regexs[target_type]
  if (ref.match(regex)) {
    return ref.replace(regex, '')
  } else {
    return null
  }
}

function createMessage(params) {
  const bot = new slack({ token: slack_bot_token })
  bot.chat.postMessage(params).then(function(slackResponse) {
    console.log({ slackResponse })
  }).catch(function(error) { console.log(error) })
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
  const branch = getBranchOrTag('branch')
  const tag = getBranchOrTag('tag')
  const repo_name = process.env.GITHUB_REPOSITORY.split('/')[1]
  const sha = process.env.GITHUB_SHA

  // Init slack message
  const repo_url = `https://github.com/${repo_path}`
  const branch_url = branch ? `https://github.com/${repo_path}/tree/${branch}` : null
  const tag_url = tag ? `https://github.com/${repo_path}/releases/tag/${tag}` : null
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

  const { data: { jobs: jobs } } = await octokit.actions.listJobsForWorkflowRun({
    owner,
    repo,
    run_id
  });

  const messages = jobs.map(function(job) {
    const sym = symbols[job.conclusion] || symbols[job.status]
    return `${sym} ${job.name}`
  })

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
    "fields": [
      `Updated at: ${new Date().toUTCString()} \n`,
      `Execution time: ${'tktktk'} \n`
    ],
    "footer": ""
  }

  const params = {
    username: "GH Actions Bot",
    icon_url: "https://i.imgur.com/o3KKCib.png",
    channel: slack_channel,
    text: '',
    blocks: [ headerBlock, jobsBlock ],
    attachments: [ footerBlock ]
  }


  createMessage(params)
}

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
