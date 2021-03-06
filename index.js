// Description:
//  Watch JIRA issues in messages and expands to readable text
//
// Author:
//   Christophe Hamerling

const url = require('url');
const JiraApi = require('jira').JiraApi;
const user = process.env.HUBOT_JIRA_EXPAND_USER;
const password = process.env.HUBOT_JIRA_EXPAND_PASSWORD;
const hostname = process.env.HUBOT_JIRA_EXPAND_HOSTNAME || 'localhost';
const port = process.env.HUBOT_JIRA_EXPAND_PORT || 443;
const protocol = process.env.HUBOT_JIRA_EXPAND_PROTOCOL || 'https';
const projects = (process.env.HUBOT_JIRA_EXPAND_PROJECTS || '').split(',');
const path = process.env.HUBOT_JIRA_EXPAND_PATH || 'jira';
const strictSSL = process.env.HUBOT_JIRA_EXPAND_STRICT_SSL || true;
const apiVersion = 'latest';

const jira = new JiraApi(protocol, hostname, port, user, password, apiVersion, true, strictSSL, null, path);
const regexp = new RegExp('(^|\\s)(' + projects.reduce((x, y) => x + '-|' + y) + '-)(\\d+)\\b', 'gi');

module.exports = (robot) => {

  robot.hear(regexp, getIssueAsText);

  function getIssueAsText(res) {
    const issueNumber = res.match[0].trim();
    if (!issueNumber) {
      return robot.logger.info('no issue')
    }

    jira.findIssue(issueNumber, (error, issue) => {
      if (error) {
        return robot.logger.error('Error while getting issue', error);
      }

      if (!issue) {
        return res.send(`Can not find issue ${issueNumber}`);
      }

      const link = getIssueUrl(issue);
      const assignee = issue.fields.assignee && issue.fields.assignee.name ? issue.fields.assignee.name : 'nobody';
      res.send(`${issue.key} : ${link} — ${issue.fields.status.name}, ${assignee} — ${issue.fields.summary}`);
    });
  }

  function getIssueUrl(issue) {
    return url.format({
      protocol,
      hostname,
      pathname: `${path}/browse/${issue.key}`
    });
  }

  return {
    getIssueAsText,
    getIssueUrl
  };
};
