const Promise = require('bluebird');
const _ = require('lodash');
const chalk = require('chalk');
const { exec } = require("child_process");

const jiraService = require('./jira.service');
const codefreshApi = require('./codefresh.api');
const configuration = require('./configuration');

async function execute() {
    const [ validationError, inputs ] = configuration.validateInputs()

    if (validationError) {
        console.log(chalk.red(validationError.message));
        process.exit(1);
    }

    console.log(`Looking for Issues from message ${inputs.message}`);

    try {
        await jiraService.init()
    } catch(e) {
        console.log(chalk.red(`Cant initialize jira client, reason ${e.message}`));
        process.exit(1);
    }


    const issues = jiraService.extract();

    if(!_.isArray(issues)) {
        console.log(chalk.yellow(`Issues werent found`));
        if (inputs.failOnNotFound === "true") {
            return process.exit(1);
        }
        return;
    }

    _.compact(await Promise.all(issues.map(async issue => {
        let normalizedIssue;
        try {
            normalizedIssue = issue.toUpperCase();
            // just for validation atm
            const issueInfo = await jiraService
                .getInfoAboutIssue(normalizedIssue);

            const baseUrl = issueInfo.baseUrl || inputs.jira.host;
            const url = `${baseUrl}/browse/${normalizedIssue}`;
            const avatarUrls = _.get(issueInfo, 'fields.assignee.avatarUrls', {});

            const result = await codefreshApi
                .createIssueV2({
                    number: normalizedIssue,
                    url: url,
                    title: _.get(issueInfo, 'fields.summary'),
                    assignee: _.get(issueInfo, 'fields.assignee.displayName'),
                    status: _.get(issueInfo, 'fields.status.name'),
                    avatarURL: Object.values(avatarUrls)[0]
                });

            if (!result) {
                console.log(chalk.red(`The image you are trying to enrich ${inputs.imageName} does not exist`));
                process.exit(1);
            } else if (!_.isEmpty(result.errors)){
                console.log(JSON.stringify(result));
                console.log(chalk.red(`The image you are trying to enrich ${inputs.imageName} does not exist`));
                process.exit(1);
            } else {
                console.log(JSON.stringify(result));
                console.log(chalk.green(`Codefresh assign issue ${normalizedIssue} to your image ${inputs.imageName}`));
            }


        } catch (e) {
            if (!e.statusCode && e.statusCode === 404) {
                console.log(chalk.yellow(`Skip issue ${normalizedIssue}, didnt find in jira system or you dont have permissions for find it`));
            } else {
                if (_.isString(e)) { // Jira returns errors in string format
                    const error = JSON.parse(e);
                    console.log('body:' + chalk.red(JSON.stringify(error.body)));
                    if (inputs.failOnNotFound === "true") {
                        return process.exit(1);
                    }
                    process.exit(0);
                } else if (e.statusCode === 401) {
                    console.log(chalk.red('Wrong username or password'));
                    return process.exit(1);
                }
                console.log('body:' + chalk.red(e.body));
                console.log(chalk.red(e.message));
                process.exit(1);
            }

        }
    })));
}
execute();
